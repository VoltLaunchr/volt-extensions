import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { preparePackageFiles } from './packaging.js';
import {
  VALID_CATEGORIES,
  VALID_PERMISSIONS,
  KEBAB_CASE_REGEX,
  SEMVER_REGEX,
} from '../constants.js';

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  manifest: Record<string, unknown> | null;
}

function hasNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.length > 0);
}

function normalizePackagePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function validateEntrypoint(
  dir: string,
  entrypoint: unknown,
  label: string,
  errors: string[]
): string | null {
  if (!entrypoint || typeof entrypoint !== 'string') {
    errors.push(`Missing required field: "${label}" (entry point file)`);
    return null;
  }

  const entryPath = join(dir, entrypoint);
  if (!existsSync(entryPath)) {
    errors.push(`Entry point file not found for "${label}": "${entrypoint}" (resolved to ${entryPath})`);
  }
  return normalizePackagePath(entrypoint);
}

export async function validateManifest(
  dir: string
): Promise<ManifestValidationResult> {
  const manifestPath = join(dir, 'manifest.json');
  const errors: string[] = [];

  if (!existsSync(manifestPath)) {
    return { valid: false, errors: ['manifest.json not found'], manifest: null };
  }

  let manifest: Record<string, unknown>;
  try {
    const raw = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw);
  } catch {
    return {
      valid: false,
      errors: ['manifest.json is not valid JSON'],
      manifest: null,
    };
  }

  // Required string fields
  for (const field of ['id', 'name', 'version', 'description'] as const) {
    if (!manifest[field] || typeof manifest[field] !== 'string') {
      errors.push(`Missing or invalid required field: "${field}"`);
    }
  }

  // id format
  if (
    typeof manifest.id === 'string' &&
    !KEBAB_CASE_REGEX.test(manifest.id)
  ) {
    errors.push(
      `"id" must be kebab-case (lowercase letters, numbers, hyphens): got "${manifest.id}"`
    );
  }

  // version format
  if (
    typeof manifest.version === 'string' &&
    !SEMVER_REGEX.test(manifest.version)
  ) {
    errors.push(
      `"version" must be semver (x.y.z): got "${manifest.version}"`
    );
  }

  // author
  if (!manifest.author || typeof manifest.author !== 'object') {
    errors.push('Missing required field: "author" (must be an object with "name")');
  } else {
    const author = manifest.author as Record<string, unknown>;
    if (!author.name || typeof author.name !== 'string') {
      errors.push('"author.name" is required and must be a string');
    }
  }

  // main — must exist on disk
  const entrypoints = new Set<string>();
  const rootMain = validateEntrypoint(dir, manifest.main, 'main', errors);
  if (rootMain) entrypoints.add(rootMain);

  // category (optional)
  if (manifest.category !== undefined) {
    if (
      !(VALID_CATEGORIES as readonly string[]).includes(
        manifest.category as string
      )
    ) {
      errors.push(
        `Invalid category: "${manifest.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`
      );
    }
  }

  // permissions (optional)
  if (manifest.permissions !== undefined) {
    if (!Array.isArray(manifest.permissions)) {
      errors.push('"permissions" must be an array');
    } else {
      for (const perm of manifest.permissions) {
        if (
          !(VALID_PERMISSIONS as readonly string[]).includes(perm as string)
        ) {
          errors.push(
            `Invalid permission: "${perm}". Must be one of: ${VALID_PERMISSIONS.join(', ')}`
          );
        }
      }
    }
  }

  // prefix (optional)
  if (manifest.prefix !== undefined) {
    if (typeof manifest.prefix !== 'string' || manifest.prefix.length === 0) {
      errors.push('"prefix" must be a non-empty string');
    }
  }

  // keywords (optional)
  if (manifest.keywords !== undefined) {
    if (
      !Array.isArray(manifest.keywords) ||
      manifest.keywords.length === 0
    ) {
      errors.push('"keywords" must be a non-empty array of strings');
    } else {
      for (const kw of manifest.keywords) {
        if (typeof kw !== 'string') {
          errors.push(`Each keyword must be a string, got: ${typeof kw}`);
          break;
        }
      }
    }
  }

  const hasManifestKeywords = hasNonEmptyStringArray(manifest.keywords);
  const hasManifestPrefix = typeof manifest.prefix === 'string' && manifest.prefix.length > 0;
  const hasCommands = Array.isArray(manifest.commands) && manifest.commands.length > 0;

  if (!hasManifestKeywords && !hasManifestPrefix && !hasCommands) {
    errors.push('Manifest must declare "keywords", "prefix", or at least one command in "commands"');
  }

  // commands (optional)
  if (manifest.commands !== undefined) {
    if (!Array.isArray(manifest.commands) || manifest.commands.length === 0) {
      errors.push('"commands" must be a non-empty array when provided');
    } else {
      const seenCommandNames = new Set<string>();
      manifest.commands.forEach((command, index) => {
        const label = `commands[${index}]`;
        if (!command || typeof command !== 'object' || Array.isArray(command)) {
          errors.push(`"${label}" must be an object`);
          return;
        }

        const cmd = command as Record<string, unknown>;
        if (!cmd.name || typeof cmd.name !== 'string') {
          errors.push(`"${label}.name" is required and must be a string`);
        } else if (seenCommandNames.has(cmd.name)) {
          errors.push(`Duplicate command name: "${cmd.name}"`);
        } else {
          seenCommandNames.add(cmd.name);
        }

        if (!cmd.title || typeof cmd.title !== 'string') {
          errors.push(`"${label}.title" is required and must be a string`);
        }

        if (cmd.main !== undefined) {
          const commandMain = validateEntrypoint(dir, cmd.main, `${label}.main`, errors);
          if (commandMain) entrypoints.add(commandMain);
        }

        const commandHasTrigger =
          (typeof cmd.prefix === 'string' && cmd.prefix.length > 0) ||
          hasNonEmptyStringArray(cmd.keywords) ||
          hasManifestKeywords;

        if (!commandHasTrigger) {
          errors.push(`"${label}" must declare "prefix" or "keywords", or inherit manifest "keywords"`);
        }
      });
    }
  }

  if (manifest.files !== undefined && entrypoints.size > 0) {
    const packaged = new Set(preparePackageFiles(dir, manifest).files);
    for (const entrypoint of entrypoints) {
      if (!packaged.has(entrypoint)) {
        errors.push(`Entry point "${entrypoint}" must be included by "files"`);
      }
    }
  }

  return { valid: errors.length === 0, errors, manifest };
}
