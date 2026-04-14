import { describe, it, expect } from 'vitest';
import {
  generateManifest,
  generateIndexTs,
  generatePackageJson,
} from '../src/utils/template.js';

describe('generateManifest', () => {
  it('generates valid JSON with all fields', () => {
    const result = generateManifest({
      id: 'my-plugin',
      name: 'My Plugin',
      description: 'A test plugin',
      author: { name: 'Author', github: 'authoruser' },
      category: 'utilities',
      permissions: ['clipboard', 'network'],
      prefix: 'mp',
      keywords: ['my', 'plugin'],
    });
    const parsed = JSON.parse(result);
    expect(parsed.id).toBe('my-plugin');
    expect(parsed.name).toBe('My Plugin');
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.main).toBe('index.ts');
    expect(parsed.prefix).toBe('mp');
    expect(parsed.keywords).toEqual(['my', 'plugin']);
    expect(parsed.permissions).toEqual(['clipboard', 'network']);
    expect(parsed.category).toBe('utilities');
    expect(parsed.author).toEqual({ name: 'Author', github: 'authoruser' });
    expect(parsed.files).toEqual(['index.ts']);
  });

  it('omits prefix and keywords when empty', () => {
    const result = generateManifest({
      id: 'simple',
      name: 'Simple',
      description: 'Simple plugin',
      author: { name: 'Author' },
      category: 'other',
      permissions: [],
      keywords: [],
    });
    const parsed = JSON.parse(result);
    expect(parsed.prefix).toBeUndefined();
    expect(parsed.keywords).toBeUndefined();
    expect(parsed.permissions).toEqual([]);
  });
});

describe('generateIndexTs', () => {
  it('generates a class with PascalCase name', () => {
    const result = generateIndexTs({
      id: 'my-cool-plugin',
      name: 'My Cool Plugin',
      description: 'Cool',
      author: { name: 'Author' },
      category: 'utilities',
      permissions: [],
      keywords: [],
    });
    expect(result).toContain('class MyCoolPluginPlugin');
    expect(result).toContain("id = 'my-cool-plugin'");
    expect(result).toContain('canHandle(context: PluginContext)');
    expect(result).toContain('match(context: PluginContext)');
    expect(result).toContain('execute(result: PluginResult)');
    expect(result).toContain('export default MyCoolPluginPlugin');
  });

  it('generates prefix-based canHandle when prefix provided', () => {
    const result = generateIndexTs({
      id: 'pass-gen',
      name: 'Password Generator',
      description: 'Generates passwords',
      author: { name: 'Author' },
      category: 'utilities',
      permissions: [],
      prefix: 'pass',
      keywords: ['pass'],
    });
    expect(result).toContain("q.startsWith('pass')");
  });

  it('generates generic canHandle when no prefix', () => {
    const result = generateIndexTs({
      id: 'generic',
      name: 'Generic',
      description: 'Generic plugin',
      author: { name: 'Author' },
      category: 'utilities',
      permissions: [],
      keywords: [],
    });
    expect(result).toContain('context.query.length > 0');
  });
});

describe('generatePackageJson', () => {
  it('generates valid package.json with correct name', () => {
    const result = generatePackageJson({
      id: 'my-plugin',
      name: 'My Plugin',
      description: 'A plugin',
      author: { name: 'Author' },
      category: 'utilities',
      permissions: [],
      keywords: ['test'],
    });
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('my-plugin');
    expect(parsed.description).toBe('A plugin');
    expect(parsed.author).toBe('Author');
    expect(parsed.dependencies['@volt/plugin-api']).toBeDefined();
    expect(parsed.devDependencies.typescript).toBeDefined();
    expect(parsed.keywords).toContain('volt');
    expect(parsed.keywords).toContain('test');
  });
});
