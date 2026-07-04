import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { validateManifest } from '../utils/manifest.js';
import {
  packageExtension,
  generateRegistryEntry,
  collectMetadata,
  generatePackageManifest,
  PackageManifest,
} from '../utils/packaging.js';
import * as log from '../utils/logger.js';

export interface PublishOptions {
  dir?: string;
  outDir?: string;
}

interface StoreSubmission {
  schemaVersion: 1;
  kind: 'volt-extension-submission';
  extension: {
    id: string;
    version: string;
    name?: string;
  };
  artifact: {
    path: string;
    fileName: string;
    size: number;
    sha256: string;
  };
  generatedAt: string;
  sourceDir: string;
  files: string[];
  registryPatch: {
    operation: 'upsert-extension';
    path: 'registry.json';
    entry: Record<string, unknown>;
  };
  review: {
    pullRequestBody: string;
    checklist: string[];
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

function rel(path: string): string {
  const relativePath = relative(process.cwd(), path);
  return relativePath.length > 0 ? relativePath : '.';
}

function buildPullRequestBody(
  manifest: Record<string, unknown>,
  packageManifest: PackageManifest
): string {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const name = typeof manifest.name === 'string' ? manifest.name : id;

  return [
    `## ${name} (${id}) v${version}`,
    '',
    '### Submission',
    '',
    `- Package: \`${packageManifest.artifact.fileName}\``,
    `- SHA-256: \`${packageManifest.artifact.sha256}\``,
    `- Files: ${packageManifest.files.length}`,
    '',
    '### Checklist',
    '',
    '- [ ] `volt-plugin test` passes for the extension',
    '- [ ] `volt-plugin validate-registry` passes from the repo root',
    '- [ ] Manifest metadata is accurate and does not overstate capabilities',
    '- [ ] Package manifest and registry patch are attached or committed',
    '- [ ] No secrets, credentials, nested archives, or build artifacts are included',
    '',
  ].join('\n');
}

export async function publishCommand(options: PublishOptions = {}): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());

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

  // 2. Metadata check (non-blocking)
  const { screenshots } = collectMetadata(
    dir,
    result.manifest.id as string,
    result.manifest.version as string
  );
  if (!existsSync(join(dir, 'metadata'))) {
    log.warn(
      'No metadata/ folder found. Add metadata/description.md and metadata/screenshot-*.png ' +
      'to improve your listing in the Extension Store.'
    );
  } else if (screenshots.length === 0) {
    log.warn('metadata/ found but no screenshot-*.png files - add at least one screenshot (800x500px).');
  } else {
    log.success(`Metadata: ${screenshots.length} screenshot(s) found`);
  }

  // 3. Package
  log.info('Creating ZIP package...');
  const id = result.manifest.id as string;
  const version = result.manifest.version as string;
  const submissionName = `${id}-v${version}`;
  const submissionDir = resolve(dir, options.outDir ?? join('.volt-publish', submissionName));
  const artifactDir = join(submissionDir, 'artifacts');
  const pkg = await packageExtension(dir, result.manifest, { outputDir: artifactDir });
  log.success(
    `Package created: ${log.bold(pkg.outputPath)} (${formatBytes(pkg.size)}, ${pkg.files.length} files)`
  );
  log.success(`SHA-256: ${pkg.sha256}`);

  // 4. Generate review artifacts
  const entry = generateRegistryEntry(dir, result.manifest, { sha256: pkg.sha256 });
  const packageManifest = generatePackageManifest(result.manifest, pkg);
  const pullRequestBody = buildPullRequestBody(result.manifest, packageManifest);
  const submission: StoreSubmission = {
    schemaVersion: 1,
    kind: 'volt-extension-submission',
    extension: {
      id,
      version,
      ...(typeof result.manifest.name === 'string' ? { name: result.manifest.name } : {}),
    },
    artifact: {
      path: rel(pkg.outputPath),
      fileName: basename(pkg.outputPath),
      size: pkg.size,
      sha256: pkg.sha256,
    },
    generatedAt: new Date().toISOString(),
    sourceDir: rel(dir),
    files: pkg.files,
    registryPatch: {
      operation: 'upsert-extension',
      path: 'registry.json',
      entry,
    },
    review: {
      pullRequestBody,
      checklist: [
        'Run volt-plugin test for the extension.',
        'Run volt-plugin validate-registry from the repo root.',
        'Review manifest metadata, permissions, package files, and checksum.',
        'Merge the source PR before publishing release assets.',
      ],
    },
  };

  mkdirSync(submissionDir, { recursive: true });
  writeJson(join(submissionDir, 'package-manifest.json'), packageManifest);
  writeJson(join(submissionDir, 'registry-entry.json'), entry);
  writeJson(join(submissionDir, 'registry-patch.json'), submission.registryPatch);
  writeJson(join(submissionDir, 'submission.json'), submission);
  writeFileSync(join(submissionDir, 'pull-request-body.md'), pullRequestBody);

  console.log('');
  log.heading('Submission artifacts');
  console.log(`  ${log.bold(rel(join(submissionDir, 'submission.json')))} ${log.dim('- full machine-readable submission')}`);
  console.log(`  ${log.bold(rel(join(submissionDir, 'registry-patch.json')))} ${log.dim('- registry upsert payload')}`);
  console.log(`  ${log.bold(rel(join(submissionDir, 'registry-entry.json')))} ${log.dim('- registry entry only')}`);
  console.log(`  ${log.bold(rel(join(submissionDir, 'package-manifest.json')))} ${log.dim('- packaged file list and checksum')}`);
  console.log(`  ${log.bold(rel(join(submissionDir, 'pull-request-body.md')))} ${log.dim('- PR body template')}`);

  // 5. Instructions
  console.log('');
  log.heading('Next steps');
  console.log(`  1. Commit the extension source under extensions/.`);
  console.log(`  2. Include or attach ${log.bold(rel(join(submissionDir, 'submission.json')))} in the PR.`);
  console.log(`  3. Maintainers review the source, registry patch, package manifest, and checksum.`);
  console.log(`  4. After merge, the release workflow publishes ${log.bold(basename(pkg.outputPath))}.`);
  console.log('');
}
