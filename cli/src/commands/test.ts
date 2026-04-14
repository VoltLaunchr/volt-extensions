import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { validateManifest } from '../utils/manifest.js';
import * as log from '../utils/logger.js';

const REQUIRED_METHODS = ['canHandle', 'match', 'execute'];

function checkPluginInterface(dir: string, main: string): string[] {
  const errors: string[] = [];
  const filePath = join(dir, main);

  let source: string;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    errors.push(`Could not read entry point: ${main}`);
    return errors;
  }

  // Check for default export
  if (
    !source.includes('export default') &&
    !source.match(/export\s*\{[^}]*default[^}]*\}/)
  ) {
    errors.push('No default export found. Extensions must export a default class or object.');
  }

  // Check for required methods
  for (const method of REQUIRED_METHODS) {
    // Match method definitions: canHandle(, async match(, execute( etc.
    const methodRegex = new RegExp(
      `(?:async\\s+)?${method}\\s*\\(`,
      'm'
    );
    if (!methodRegex.test(source)) {
      errors.push(`Missing required method: ${method}()`);
    }
  }

  return errors;
}

function runTypeCheck(dir: string): { ok: boolean; output: string } {
  try {
    execFileSync('npx', ['tsc', '--noEmit'], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, output: '' };
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string };
    return {
      ok: false,
      output: (error.stderr || error.stdout || 'Unknown TypeScript error').trim(),
    };
  }
}

export async function testCommand(): Promise<void> {
  const dir = process.cwd();
  let hasError = false;

  log.heading('Validating extension');

  // 1. Manifest validation
  log.info('Checking manifest.json...');
  const result = await validateManifest(dir);

  if (result.valid) {
    log.success('manifest.json is valid');
  } else {
    hasError = true;
    for (const err of result.errors) {
      log.error(err);
    }
  }

  // 2. Plugin interface check
  if (result.manifest?.main) {
    log.info('Checking Plugin interface...');
    const interfaceErrors = checkPluginInterface(
      dir,
      result.manifest.main as string
    );
    if (interfaceErrors.length === 0) {
      log.success('Plugin interface: canHandle, match, execute found');
    } else {
      hasError = true;
      for (const err of interfaceErrors) {
        log.error(err);
      }
    }
  }

  // 3. TypeScript type-check
  log.info('Running TypeScript check...');
  const tsc = runTypeCheck(dir);
  if (tsc.ok) {
    log.success('TypeScript: no errors');
  } else {
    hasError = true;
    log.error('TypeScript errors:');
    console.log(tsc.output);
  }

  // Summary
  console.log('');
  if (hasError) {
    log.error('Validation failed. Fix the errors above.');
    process.exit(1);
  } else {
    log.success('All checks passed!');
  }
}
