import { validateRegistry } from '../utils/registry.js';
import { findRepoRoot } from '../utils/schema.js';
import * as log from '../utils/logger.js';

export async function validateRegistryCommand(): Promise<void> {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    log.error('Could not locate volt-extensions repo root from current directory.');
    process.exit(1);
  }

  log.heading('Validating extension registry');
  const result = validateRegistry(repoRoot);

  for (const warning of result.warnings) {
    log.warn(warning);
  }

  if (!result.valid) {
    for (const error of result.errors) {
      log.error(error);
    }
    process.exit(1);
  }

  log.success('registry.json is valid');
}
