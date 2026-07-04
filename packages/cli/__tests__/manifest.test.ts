import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateManifest } from '../src/utils/manifest.js';

const TEST_DIR = join(tmpdir(), 'volt-cli-test-manifest');

function writeManifest(dir: string, manifest: Record<string, unknown>): void {
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
}

function validManifest(): Record<string, unknown> {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: { name: 'Test Author' },
    main: 'index.ts',
    category: 'utilities',
    permissions: ['clipboard'],
    keywords: ['test'],
  };
}

describe('validateManifest', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    // Create a dummy entry point
    writeFileSync(join(TEST_DIR, 'index.ts'), 'export default {}');
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('passes for a valid manifest', async () => {
    writeManifest(TEST_DIR, validManifest());
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when manifest.json is missing', async () => {
    const emptyDir = join(TEST_DIR, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    const result = await validateManifest(emptyDir);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('manifest.json not found');
  });

  it('fails for invalid JSON', async () => {
    writeFileSync(join(TEST_DIR, 'manifest.json'), '{invalid}');
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('not valid JSON');
  });

  it('fails when required fields are missing', async () => {
    writeManifest(TEST_DIR, {});
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('"id"'))).toBe(true);
    expect(result.errors.some((e) => e.includes('"name"'))).toBe(true);
    expect(result.errors.some((e) => e.includes('"version"'))).toBe(true);
    expect(result.errors.some((e) => e.includes('"description"'))).toBe(true);
    expect(result.errors.some((e) => e.includes('"author"'))).toBe(true);
    expect(result.errors.some((e) => e.includes('"main"'))).toBe(true);
  });

  it('fails for invalid id format', async () => {
    const m = validManifest();
    m.id = 'Invalid Plugin';
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('kebab-case'))).toBe(true);
  });

  it('fails for invalid version format', async () => {
    const m = validManifest();
    m.version = 'v1.0';
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('semver'))).toBe(true);
  });

  it('fails for invalid category', async () => {
    const m = validManifest();
    m.category = 'invalid-category';
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid category'))).toBe(true);
  });

  it('fails for invalid permission', async () => {
    const m = validManifest();
    m.permissions = ['clipboard', 'teleportation'];
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid permission'))).toBe(true);
  });

  it('passes for all current Volt runtime permissions', async () => {
    const m = validManifest();
    m.permissions = ['clipboard', 'network', 'notifications', 'openUrl', 'oauth', 'ai', 'system'];
    m.category = 'developer';
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(true);
  });

  it('rejects legacy permissions not supported by the extension runtime', async () => {
    const m = validManifest();
    m.permissions = ['filesystem', 'shell'];
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid permission'))).toBe(true);
  });

  it('fails when entry point file does not exist', async () => {
    const m = validManifest();
    m.main = 'nonexistent.ts';
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Entry point file not found'))).toBe(true);
  });

  it('fails for empty keywords array', async () => {
    const m = validManifest();
    m.keywords = [];
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('keywords'))).toBe(true);
  });

  it('fails when no trigger or commands are declared', async () => {
    const m = {
      id: 'minimal-plugin',
      name: 'Minimal',
      version: '1.0.0',
      description: 'Minimal plugin',
      author: { name: 'Author' },
      main: 'index.ts',
    };
    writeManifest(TEST_DIR, m);
    const result = await validateManifest(TEST_DIR);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('keywords'))).toBe(true);
  });

  it('passes for a command-only manifest with command prefix', async () => {
    const m = {
      id: 'command-only',
      name: 'Command Only',
      version: '1.0.0',
      description: 'Command-only extension',
      author: { name: 'Author' },
      main: 'index.ts',
      commands: [
        {
          name: 'search-docs',
          title: 'Search Docs',
          prefix: 'docs',
          main: 'src/search.ts',
        },
      ],
    };
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'search.ts'), 'export default {}');
    writeManifest(TEST_DIR, m);

    const result = await validateManifest(TEST_DIR);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when command entry point does not exist', async () => {
    const m = validManifest();
    m.commands = [
      {
        name: 'missing-command',
        title: 'Missing Command',
        prefix: 'missing',
        main: 'src/missing.ts',
      },
    ];
    writeManifest(TEST_DIR, m);

    const result = await validateManifest(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('commands[0].main'))).toBe(true);
  });

  it('fails when command has no effective trigger', async () => {
    const m = validManifest();
    delete m.keywords;
    delete m.prefix;
    m.commands = [
      {
        name: 'untriggered',
        title: 'Untriggered',
      },
    ];
    writeManifest(TEST_DIR, m);

    const result = await validateManifest(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('commands[0]'))).toBe(true);
  });

  it('fails when files omits a command entry point', async () => {
    const m = validManifest();
    m.commands = [
      {
        name: 'search-docs',
        title: 'Search Docs',
        prefix: 'docs',
        main: 'src/search.ts',
      },
    ];
    m.files = ['manifest.json', 'index.ts'];
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'search.ts'), 'export default {}');
    writeManifest(TEST_DIR, m);

    const result = await validateManifest(TEST_DIR);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Entry point "src/search.ts" must be included by "files"');
  });
});
