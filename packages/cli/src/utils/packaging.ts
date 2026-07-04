import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, basename } from 'node:path';
import archiver from 'archiver';

const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  '.volt-publish',
  '.volt-store',
  'coverage',
  '.DS_Store',
  'Thumbs.db',
];

const EXCLUDE_PATTERNS = [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/];
const FORBIDDEN_PACKAGE_PATTERNS = [
  /(^|[/\\])\.env($|[./\\])/,
  /(^|[/\\])\.npmrc$/,
  /(^|[/\\])\.netrc$/,
  /(^|[/\\])id_rsa$/,
  /(^|[/\\])id_ed25519$/,
  /(^|[/\\]).*\.(pem|key|p12|pfx)$/,
  /(^|[/\\]).*\.(zip|tar|tar\.gz|tgz|7z|rar)$/,
];

function toPackagePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

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
    const rel = toPackagePath(relative(base, fullPath));
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
      resolved.push(toPackagePath(entry));
    }
  }
  // Always include manifest.json
  if (!resolved.includes('manifest.json')) {
    resolved.push('manifest.json');
  }
  return [...new Set(resolved)];
}

export function validatePackageFiles(files: string[]): string[] {
  return files
    .filter((file) => FORBIDDEN_PACKAGE_PATTERNS.some((pattern) => pattern.test(file)))
    .map((file) => `Forbidden file in extension package: ${file}`);
}

export interface PackageDryRunResult {
  files: string[];
  errors: string[];
}

export function preparePackageFiles(
  dir: string,
  manifest: Record<string, unknown>
): PackageDryRunResult {
  let files: string[];
  if (
    Array.isArray(manifest.files) &&
    manifest.files.length > 0
  ) {
    files = resolveManifestFiles(dir, manifest.files as string[]);
  } else {
    files = collectFiles(dir, dir);
  }

  if (!files.includes('manifest.json')) {
    files.push('manifest.json');
  }

  const uniqueFiles = [...new Set(files)].sort();
  return {
    files: uniqueFiles,
    errors: validatePackageFiles(uniqueFiles),
  };
}

export interface PackageResult {
  outputPath: string;
  files: string[];
  size: number;
  sha256: string;
}

export interface PackageOptions {
  outputDir?: string;
}

export interface PackageManifest {
  schemaVersion: 1;
  extension: {
    id: string;
    version: string;
    name?: string;
  };
  artifact: {
    fileName: string;
    size: number;
    sha256: string;
  };
  files: string[];
  generatedAt: string;
}

export function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export async function packageExtension(
  dir: string,
  manifest: Record<string, unknown>,
  options: PackageOptions = {}
): Promise<PackageResult> {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const outputName = `${id}-v${version}.zip`;
  const outputDir = options.outputDir ?? dir;
  const outputPath = join(outputDir, outputName);

  const dryRun = preparePackageFiles(dir, manifest);
  if (dryRun.errors.length > 0) {
    throw new Error(dryRun.errors.join('\n'));
  }
  const files = dryRun.files;
  mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({
        outputPath,
        files,
        size: archive.pointer(),
        sha256: sha256File(outputPath),
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

export function generatePackageManifest(
  manifest: Record<string, unknown>,
  pkg: PackageResult,
  generatedAt = new Date().toISOString()
): PackageManifest {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const name = typeof manifest.name === 'string' ? manifest.name : undefined;

  return {
    schemaVersion: 1,
    extension: {
      id,
      version,
      ...(name ? { name } : {}),
    },
    artifact: {
      fileName: basename(pkg.outputPath),
      size: pkg.size,
      sha256: pkg.sha256,
    },
    files: pkg.files,
    generatedAt,
  };
}

const SCREENSHOT_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

/**
 * Collect screenshot URLs from `metadata/` folder.
 * In the published registry, screenshots are hosted as GitHub release assets.
 * Returns relative paths so the publisher can upload them or convert to absolute URLs.
 */
export function collectMetadata(
  dir: string,
  extensionId: string,
  version: string
): { screenshots: string[]; readmeUrl: string | null } {
  const metaDir = join(dir, 'metadata');
  if (!existsSync(metaDir)) {
    return { screenshots: [], readmeUrl: null };
  }

  const base = `https://github.com/VoltLaunchr/volt-extensions/releases/download/${extensionId}-v${version}`;
  const entries = readdirSync(metaDir).sort();

  const screenshots: string[] = [];
  let readmeUrl: string | null = null;

  for (const entry of entries) {
    const ext = entry.slice(entry.lastIndexOf('.')).toLowerCase();
    const name = basename(entry);
    if (SCREENSHOT_EXTS.has(ext) && /^screenshot/i.test(name)) {
      screenshots.push(`${base}/${name}`);
    } else if (name === 'description.md') {
      readmeUrl = `${base}/description.md`;
    }
  }

  return { screenshots, readmeUrl };
}

export function generateRegistryEntry(
  dir: string,
  manifest: Record<string, unknown>,
  options: { sha256?: string } = {}
): Record<string, unknown> {
  const id = manifest.id as string;
  const version = manifest.version as string;
  const now = new Date().toISOString();
  const { screenshots, readmeUrl } = collectMetadata(dir, id, version);

  return {
    manifest,
    downloadUrl: `https://github.com/VoltLaunchr/volt-extensions/releases/download/${id}-v${version}/${id}-v${version}.zip`,
    downloads: 0,
    stars: 0,
    verified: false,
    featured: false,
    createdAt: now,
    updatedAt: now,
    ...(options.sha256 ? { sha256: options.sha256 } : {}),
    ...(screenshots.length > 0 ? { screenshots } : {}),
    ...(readmeUrl ? { readmeUrl } : {}),
  };
}
