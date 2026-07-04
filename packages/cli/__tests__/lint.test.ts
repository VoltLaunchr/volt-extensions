import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { hasEslintConfig, runEslint } from '../src/commands/lint.js';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'volt-lint-'));
}

describe('lint command helpers', () => {
  it('detects flat ESLint config files', () => {
    const dir = tempDir();
    try {
      expect(hasEslintConfig(dir)).toBe(false);
      writeFileSync(join(dir, 'eslint.config.js'), 'export default [];\n');
      expect(hasEslintConfig(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails clearly when ESLint config is missing', () => {
    const dir = tempDir();
    try {
      const result = runEslint(dir);
      expect(result.ok).toBe(false);
      expect(result.output).toContain('ESLint config not found');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
