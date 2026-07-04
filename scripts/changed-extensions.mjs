import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const EXTENSION_ROOTS = new Set(['extensions', 'community', 'examples', 'plugins']);

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function changedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;
  const before = process.env.GITHUB_EVENT_BEFORE;

  const candidates = [];
  if (baseRef) candidates.push(['diff', '--name-only', `origin/${baseRef}...HEAD`]);
  if (before && !/^0+$/.test(before)) candidates.push(['diff', '--name-only', `${before}...HEAD`]);
  candidates.push(['diff', '--name-only', 'HEAD']);
  candidates.push(['diff', '--name-only', 'HEAD~1...HEAD']);
  candidates.push(['ls-files']);

  for (const args of candidates) {
    try {
      const out = git(args);
      if (out) return out.split(/\r?\n/).filter(Boolean);
    } catch {
      // Try the next strategy.
    }
  }
  return [];
}

const dirs = new Set();
for (const file of changedFiles()) {
  const parts = file.split(/[\\/]/);
  if (parts.length < 2 || !EXTENSION_ROOTS.has(parts[0])) continue;
  const dir = `${parts[0]}/${parts[1]}`;
  if (existsSync(join(process.cwd(), dir, 'manifest.json'))) {
    dirs.add(dir);
  }
}

for (const dir of [...dirs].sort()) {
  console.log(dir);
}
