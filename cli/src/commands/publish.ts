import { validateManifest } from '../utils/manifest.js';
import { packageExtension, generateRegistryEntry } from '../utils/packaging.js';
import * as log from '../utils/logger.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function publishCommand(): Promise<void> {
  const dir = process.cwd();

  log.heading('Publishing extension');

  // 1. Validate manifest
  log.info('Validating manifest...');
  const result = await validateManifest(dir);
  if (!result.valid || !result.manifest) {
    for (const err of result.errors) {
      log.error(err);
    }
    log.error('Fix manifest errors before publishing.');
    process.exit(1);
  }
  log.success('Manifest valid');

  // 2. Package
  log.info('Creating ZIP package...');
  const pkg = await packageExtension(dir, result.manifest);
  log.success(
    `Package created: ${log.bold(pkg.outputPath)} (${formatBytes(pkg.size)}, ${pkg.files.length} files)`
  );

  // 3. Generate registry entry
  const entry = generateRegistryEntry(result.manifest);

  console.log('');
  log.heading('Registry entry');
  console.log(
    'Add this to the "extensions" array in registry.json:\n'
  );
  console.log(JSON.stringify(entry, null, 2));

  // 4. Instructions
  console.log('');
  log.heading('Next steps');
  console.log(`  1. Fork ${log.bold('VoltLaunchr/volt-extensions')} on GitHub`);
  console.log(`  2. Create a GitHub release with tag: ${log.bold(`${result.manifest.id}-v${result.manifest.version}`)}`);
  console.log(`  3. Upload ${log.bold(pkg.outputPath)} to the release`);
  console.log(`  4. Add the registry entry above to ${log.bold('registry.json')}`);
  console.log(`  5. Submit a pull request`);
  console.log('');
}
