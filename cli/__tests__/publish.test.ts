import { describe, it, expect } from 'vitest';
import { generateRegistryEntry } from '../src/utils/packaging.js';

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

    const entry = generateRegistryEntry(manifest);
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
    const entry = generateRegistryEntry({
      id: 'x',
      version: '1.0.0',
    });
    expect(() => new Date(entry.createdAt as string)).not.toThrow();
    expect(new Date(entry.createdAt as string).toISOString()).toBe(
      entry.createdAt
    );
  });
});
