import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateRegistry } from '../src/utils/registry.js';

const TEST_DIR = join(tmpdir(), 'volt-cli-test-registry');

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

function manifest(version = '1.0.0'): Record<string, unknown> {
  return {
    id: 'demo',
    name: 'Demo',
    version,
    description: 'Demo extension',
    author: { name: 'Volt' },
    keywords: ['demo'],
    prefix: 'demo',
    category: 'utilities',
    repository: 'https://github.com/VoltLaunchr/volt-extensions',
    license: 'MIT',
    minVoltVersion: '0.4.0',
    permissions: ['network'],
  };
}

function registryEntry(version = '1.0.0'): Record<string, unknown> {
  return {
    manifest: manifest(version),
    downloadUrl: `https://github.com/VoltLaunchr/volt-extensions/releases/download/demo-v${version}/demo-v${version}.zip`,
    downloads: 0,
    stars: 0,
    verified: true,
    featured: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function writeRegistry(entries: Record<string, unknown>[]): void {
  writeJson(join(TEST_DIR, 'registry.json'), {
    version: '1.0.0',
    lastUpdated: '2026-01-01T00:00:00.000Z',
    extensions: entries,
  });
}

function writeSourceManifest(sourceManifest = manifest()): void {
  const dir = join(TEST_DIR, 'plugins', 'demo');
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, 'manifest.json'), {
    ...sourceManifest,
    main: 'src/index.ts',
  });
}

describe('validateRegistry', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, 'schemas'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('passes for a valid registry entry matching source manifest', () => {
    writeRegistry([registryEntry()]);
    writeSourceManifest();

    const result = validateRegistry(TEST_DIR);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when registry manifest drifts from source manifest', () => {
    writeRegistry([registryEntry('1.0.1')]);
    writeSourceManifest(manifest('1.0.0'));

    const result = validateRegistry(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('version differs'))).toBe(true);
  });

  it('fails when downloadUrl does not match the registry version tag', () => {
    const entry = registryEntry();
    entry.downloadUrl =
      'https://github.com/VoltLaunchr/volt-extensions/releases/download/demo-v9.9.9/demo-v9.9.9.zip';
    writeRegistry([entry]);
    writeSourceManifest();

    const result = validateRegistry(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('release tag demo-v1.0.0'))).toBe(true);
  });

  it('fails on duplicate extension ids', () => {
    writeRegistry([registryEntry(), registryEntry()]);
    writeSourceManifest();

    const result = validateRegistry(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('duplicate extension id'))).toBe(true);
  });
});
