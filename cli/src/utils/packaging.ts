import { createWriteStream, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import archiver from 'archiver';

const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  '.DS_Store',
  'Thumbs.db',
];

const EXCLUDE_PATTERNS = [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/];

function shouldExclude(relativePath: string): boolean {
  const parts = relativePath.split(/[\\/]/);
  if (parts.some((p) => DEFAULT_EXCLUDES.includes(p))) return true;
  return EXCLUDE_PATTERNS.some((re) => re.test(relativePath));
}

function collectFiles(dir: string, base: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const rel = relative(base, fullPath);
    if (shouldExclude(rel)) continue;
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, base));
    } else {
      files.push(rel);
    }
  }
  return files;
}

function resolveManifestFiles(
  dir: string,
  manifestFiles: string[]
): string[] {
  const resolved: string[] = [];
  for (const entry of manifestFiles) {
    const fullPath = join(dir, entry);
    if (!existsSync(fullPath)) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      resolved.push(...collectFiles(fullPath, dir));
    } else {
      resolved.push(entry);
    }
  }
  // Always include manifest.json
  if (!resolved.includes('manifest.json')) {
    resolved.push('manifest.json');
  }
  return [...new Set(resolved)];
}

export interface PackageResult {
  outputPath: string;
  files: string[];
  size: number;
}

export async function packageExtension(
  dir: string,
  manifest: Record<string, unknown>
): Promise<PackageResult> {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const outputName = `${id}-v${version}.zip`;
  const outputPath = join(dir, outputName);

  // Determine files to include
  let files: string[];
  if (
    Array.isArray(manifest.files) &&
    manifest.files.length > 0
  ) {
    files = resolveManifestFiles(dir, manifest.files as string[]);
  } else {
    files = collectFiles(dir, dir);
  }

  // Always include manifest.json
  if (!files.includes('manifest.json')) {
    files.push('manifest.json');
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({
        outputPath,
        files,
        size: archive.pointer(),
      });
    });

    archive.on('error', reject);
    archive.pipe(output);

    for (const file of files) {
      archive.file(join(dir, file), { name: file });
    }

    archive.finalize();
  });
}

export function generateRegistryEntry(
  manifest: Record<string, unknown>
): Record<string, unknown> {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const now = new Date().toISOString();

  return {
    manifest,
    downloadUrl: `https://github.com/VoltLaunchr/volt-extensions/releases/download/${id}-v${version}/${id}-v${version}.zip`,
    downloads: 0,
    stars: 0,
    verified: false,
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
}
