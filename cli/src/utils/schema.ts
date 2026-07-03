import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_MARKERS = ['registry.json', 'schemas'];

function isRepoRoot(dir: string): boolean {
  return REPO_MARKERS.every((marker) => existsSync(join(dir, marker)));
}

export function findRepoRoot(startDir: string = process.cwd()): string | null {
  let current = resolve(startDir);
  while (true) {
    if (isRepoRoot(current)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function schemaPath(schemaFile: string): string {
  const candidates = [
    findRepoRoot(process.cwd()),
    findRepoRoot(__dirname),
  ].filter((value): value is string => value !== null);

  for (const root of candidates) {
    const candidate = join(root, 'schemas', schemaFile);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate schemas/${schemaFile}. Run from the volt-extensions repo or package the schema with the CLI.`
  );
}

export function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function validateAgainstSchemaFile(
  schemaFile: string,
  value: unknown
): string[] {
  const schema = readJsonFile(schemaPath(schemaFile)) as object;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  validate(value);
  return (validate.errors ?? []).map((error) => {
    const path = error.instancePath
      ? error.instancePath.slice(1).replace(/\//g, '.')
      : 'root';
    return `${path}: ${error.message ?? 'unknown schema error'}`;
  });
}
