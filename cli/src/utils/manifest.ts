import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  if (!manifest.main || typeof manifest.main !== 'string') {
    errors.push('Missing required field: "main" (entry point file)');
  } else {
    const mainPath = join(dir, manifest.main as string);
    if (!existsSync(mainPath)) {
      errors.push(
        `Entry point file not found: "${manifest.main}" (resolved to ${mainPath})`
      );
    }
  }

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

  return { valid: errors.length === 0, errors, manifest };
}
