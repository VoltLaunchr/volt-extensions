import { describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  generatePackageManifest,
  generateRegistryEntry,
  preparePackageFiles,
  validatePackageFiles,
} from '../src/utils/packaging.js';

describe('generateRegistryEntry', () => {
  it('generates a complete registry entry', () => {
    const manifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '2.1.0',
      description: 'A test',
      author: { name: 'Author' },
      main: 'index.ts',
    };

    const entry = generateRegistryEntry(process.cwd(), manifest);
    expect(entry.manifest).toEqual(manifest);
    expect(entry.downloadUrl).toBe(
      'https://github.com/VoltLaunchr/volt-extensions/releases/download/test-plugin-v2.1.0/test-plugin-v2.1.0.zip'
    );
    expect(entry.downloads).toBe(0);
    expect(entry.stars).toBe(0);
    expect(entry.verified).toBe(false);
    expect(entry.featured).toBe(false);
    expect(entry.createdAt).toBeDefined();
    expect(entry.updatedAt).toBeDefined();
  });

  it('generates valid ISO date strings', () => {
    const entry = generateRegistryEntry(process.cwd(), {
      id: 'x',
      version: '1.0.0',
    });
    expect(() => new Date(entry.createdAt as string)).not.toThrow();
    expect(new Date(entry.createdAt as string).toISOString()).toBe(
      entry.createdAt
    );
  });

  it('includes package checksum when provided', () => {
    const sha256 = 'a'.repeat(64);
    const entry = generateRegistryEntry(
      process.cwd(),
      {
        id: 'test-plugin',
        version: '2.1.0',
      },
      { sha256 }
    );

    expect(entry.sha256).toBe(sha256);
  });

  it('generates a package manifest for store review', () => {
    const manifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '2.1.0',
    };
    const packageManifest = generatePackageManifest(
      manifest,
      {
        outputPath: 'D:/tmp/test-plugin-v2.1.0.zip',
        files: ['manifest.json', 'src/index.ts'],
        size: 1234,
        sha256: 'b'.repeat(64),
      },
      '2026-01-01T00:00:00.000Z'
    );

    expect(packageManifest).toEqual({
      schemaVersion: 1,
      extension: {
        id: 'test-plugin',
        version: '2.1.0',
        name: 'Test Plugin',
      },
      artifact: {
        fileName: 'test-plugin-v2.1.0.zip',
        size: 1234,
        sha256: 'b'.repeat(64),
      },
      files: ['manifest.json', 'src/index.ts'],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('rejects secrets and nested archives from extension packages', () => {
    const errors = validatePackageFiles([
      'manifest.json',
      'src/index.ts',
      '.env',
      'keys/private.pem',
      'github-v1.2.1.tar.gz',
    ]);

    expect(errors).toHaveLength(3);
    expect(errors.join('\n')).toContain('.env');
    expect(errors.join('\n')).toContain('private.pem');
    expect(errors.join('\n')).toContain('github-v1.2.1.tar.gz');
  });

  it('prepares the same package file list used by publish', () => {
    const manifest = {
      files: ['src/index.ts'],
    };

    const result = preparePackageFiles(process.cwd(), manifest);

    expect(result.files).toContain('manifest.json');
    expect(result.files).toContain('src/index.ts');
    expect(result.errors).toEqual([]);
  });

  it('normalizes package file paths for portable archives', () => {
    const dir = mkdtempSync(join(tmpdir(), 'volt-package-paths-'));
    try {
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'manifest.json'), '{}');
      writeFileSync(join(dir, 'src', 'index.ts'), '');

      const result = preparePackageFiles(dir, {});

      expect(result.files).toContain('manifest.json');
      expect(result.files).toContain('src/index.ts');
      expect(result.files.every((file) => !file.includes('\\'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
