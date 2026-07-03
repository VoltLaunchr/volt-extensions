import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { validateManifest } from '../utils/manifest.js';
import { validateAgainstSchemaFile } from '../utils/schema.js';
import { preparePackageFiles } from '../utils/packaging.js';
import { runEslint } from './lint.js';
import * as log from '../utils/logger.js';

const REQUIRED_METHODS = ['canHandle', 'match', 'execute'];

export interface TestOptions {
  dir?: string;
}

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

function validateAgainstSchema(manifest: Record<string, unknown>): string[] {
  return validateAgainstSchemaFile('manifest.schema.json', manifest).map(
    (error) => `  ${error}`
  );
}

export async function testCommand(options: TestOptions = {}): Promise<void> {
  const dir = options.dir ?? process.cwd();
  let hasError = false;

  log.heading('Validating extension');

  // 1. Manifest validation (semantic checks)
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

  // 2. JSON Schema validation
  if (result.manifest) {
    log.info('Validating against JSON Schema (voltlauncher.com/schemas/manifest.json)...');
    try {
      const schemaErrors = validateAgainstSchema(result.manifest);
      if (schemaErrors.length === 0) {
        log.success('Schema validation: OK');
      } else {
        hasError = true;
        log.error('Schema violations:');
        for (const e of schemaErrors) console.error(e);
      }
    } catch (err) {
      hasError = true;
      log.error(`Schema validation failed: ${String(err)}`);
    }
  }

  // 3. Plugin interface check
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

  // 4. ESLint
  log.info('Running ESLint...');
  const lint = runEslint(dir);
  if (lint.ok) {
    log.success('ESLint: no errors');
  } else {
    hasError = true;
    log.error('ESLint errors:');
    console.log(lint.output);
  }

  // 5. TypeScript type-check
  log.info('Running TypeScript check...');
  const tsc = runTypeCheck(dir);
  if (tsc.ok) {
    log.success('TypeScript: no errors');
  } else {
    hasError = true;
    log.error('TypeScript errors:');
    console.log(tsc.output);
  }

  // 6. Package dry-run
  if (result.manifest) {
    log.info('Running package dry-run...');
    const dryRun = preparePackageFiles(dir, result.manifest);
    if (dryRun.errors.length === 0) {
      log.success(`Package dry-run: ${dryRun.files.length} files ready`);
    } else {
      hasError = true;
      log.error('Package dry-run failed:');
      for (const err of dryRun.errors) {
        console.error(`  ${err}`);
      }
    }
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
