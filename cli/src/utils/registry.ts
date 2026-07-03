import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { validateAgainstSchemaFile } from './schema.js';

export interface RegistryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface RegistryEntry {
  manifest?: Record<string, unknown>;
  downloadUrl?: string;
}

interface RegistryFile {
  extensions?: RegistryEntry[];
}

const SOURCE_DIRS = ['plugins', 'extensions', 'community', 'examples'];

const DRIFT_KEYS = [
  'name',
  'version',
  'description',
  'author',
  'keywords',
  'prefix',
  'category',
  'permissions',
  'minVoltVersion',
];

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(obj[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sourceManifestPath(repoRoot: string, id: string): string | null {
  for (const sourceDir of SOURCE_DIRS) {
    const path = join(repoRoot, sourceDir, id, 'manifest.json');
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function validateDownloadUrl(entry: RegistryEntry, errors: string[]): void {
  const manifest = entry.manifest;
  if (!manifest || typeof manifest.id !== 'string' || typeof manifest.version !== 'string') {
    return;
  }
  if (typeof entry.downloadUrl !== 'string') {
    return;
  }

  let url: URL;
  try {
    url = new URL(entry.downloadUrl);
  } catch {
    return;
  }

  const expectedTag = `${manifest.id}-v${manifest.version}`;
  if (!url.pathname.includes(`/releases/download/${expectedTag}/`)) {
    errors.push(
      `registry:${manifest.id}: downloadUrl must use release tag ${expectedTag}`
    );
  }

  const artifact = basename(url.pathname);
  if (
    artifact !== `${expectedTag}.zip` &&
    artifact !== `${expectedTag}.tar.gz`
  ) {
    errors.push(
      `registry:${manifest.id}: download artifact must be ${expectedTag}.zip or ${expectedTag}.tar.gz`
    );
  }
}

function validateSourceDrift(
  repoRoot: string,
  entry: RegistryEntry,
  errors: string[],
  warnings: string[]
): void {
  const manifest = entry.manifest;
  if (!manifest || typeof manifest.id !== 'string') {
    return;
  }

  const sourcePath = sourceManifestPath(repoRoot, manifest.id);
  if (!sourcePath) {
    warnings.push(
      `registry:${manifest.id}: no source manifest found under ${SOURCE_DIRS.join(', ')}`
    );
    return;
  }

  const source = readJson(sourcePath);
  for (const key of DRIFT_KEYS) {
    if (!(key in source) || !(key in manifest)) {
      continue;
    }
    if (stable(source[key]) !== stable(manifest[key])) {
      errors.push(
        `registry:${manifest.id}: ${key} differs from ${sourcePath}`
      );
    }
  }
}

export function validateRegistry(repoRoot: string): RegistryValidationResult {
  const registryPath = join(repoRoot, 'registry.json');
  const errors: string[] = [];
  const warnings: string[] = [];

  let registry: RegistryFile;
  try {
    registry = readJson(registryPath) as RegistryFile;
  } catch (err) {
    return {
      valid: false,
      errors: [`registry.json could not be read: ${String(err)}`],
      warnings,
    };
  }

  try {
    errors.push(
      ...validateAgainstSchemaFile('registry.schema.json', registry).map(
        (error) => `registry schema: ${error}`
      )
    );
  } catch (err) {
    errors.push(`registry schema validation failed: ${String(err)}`);
  }

  const ids = new Set<string>();
  for (const entry of registry.extensions ?? []) {
    const id = entry.manifest?.id;
    if (typeof id !== 'string') {
      continue;
    }
    if (ids.has(id)) {
      errors.push(`registry:${id}: duplicate extension id`);
    }
    ids.add(id);

    validateDownloadUrl(entry, errors);
    validateSourceDrift(repoRoot, entry, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
