import { watch } from 'node:fs';
import { writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { validateManifest } from '../utils/manifest.js';
import * as log from '../utils/logger.js';

const SENTINEL_FILE = '.volt-dev-reload';
const DEBOUNCE_MS = 300;
const WATCHED_EXTENSIONS = new Set(['.ts', '.js', '.json', '.tsx', '.jsx']);

function writeSentinel(dir: string): void {
  const sentinel = join(dir, SENTINEL_FILE);
  writeFileSync(sentinel, String(Date.now()), 'utf-8');
}

function runTypeCheckAsync(dir: string): void {
  execFile('npx', ['tsc', '--noEmit'], { cwd: dir }, (err, _stdout, stderr) => {
    if (err) {
      const lines = stderr.trim().split('\n').slice(0, 5);
      for (const line of lines) log.warn(line);
      if (stderr.trim().split('\n').length > 5) log.warn('  … (more errors)');
    } else {
      log.success('TypeScript: OK');
    }
  });
}

export async function devCommand(): Promise<void> {
  const dir = process.cwd();

  if (!existsSync(join(dir, 'manifest.json'))) {
    log.error('No manifest.json found. Run this command from an extension directory.');
    process.exit(1);
  }

  const result = await validateManifest(dir);
  if (!result.valid) {
    for (const err of result.errors) log.error(err);
    log.error('Fix manifest errors before starting dev mode.');
    process.exit(1);
  }

  const manifest = result.manifest as { id: string; name: string };
  log.heading(`Watching ${manifest.name} (${manifest.id})`);
  log.info(`Extension directory: ${dir}`);
  log.info(`Changes will be hot-reloaded in Volt automatically.\n`);

  // Write initial sentinel so Volt knows dev mode is active
  writeSentinel(dir);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const watcher = watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const ext = filename.slice(filename.lastIndexOf('.'));
    if (!WATCHED_EXTENSIONS.has(ext)) return;
    if (filename.startsWith('.') || filename.startsWith('node_modules')) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const rel = relative(dir, join(dir, filename));
      log.info(`Changed: ${rel}`);
      writeSentinel(dir);
      runTypeCheckAsync(dir);
    }, DEBOUNCE_MS);
  });

  log.info('Watching for changes… (Ctrl+C to stop)\n');

  process.on('SIGINT', () => {
    watcher.close();
    log.info('\nStopped.');
    process.exit(0);
  });

  // Keep alive
  await new Promise<never>(() => {});
}
