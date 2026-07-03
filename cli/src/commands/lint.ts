import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { npxCommand } from '../utils/npm-bin.js';
import * as log from '../utils/logger.js';

export interface LintOptions {
  dir?: string;
}

export interface LintResult {
  ok: boolean;
  output: string;
}

const ESLINT_CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

export function hasEslintConfig(dir: string): boolean {
  return ESLINT_CONFIG_FILES.some((file) => existsSync(resolve(dir, file)));
}

export function runEslint(dir: string): LintResult {
  if (!hasEslintConfig(dir)) {
    return {
      ok: false,
      output:
        'ESLint config not found. Add eslint.config.js or use the TypeScript template.',
    };
  }

  try {
    const command = npxCommand(['eslint', '.']);
    execFileSync(command.command, command.args, {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: '' };
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string };
    return {
      ok: false,
      output: (error.stdout || error.stderr || 'Unknown ESLint error').trim(),
    };
  }
}

export async function lintCommand(options: LintOptions = {}): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());

  log.heading('Linting extension');
  log.info(`Running ESLint in ${dir}...`);

  const lint = runEslint(dir);
  if (lint.ok) {
    log.success('ESLint: no errors');
    return;
  }

  log.error('ESLint failed:');
  console.log(lint.output);
  process.exit(1);
}
