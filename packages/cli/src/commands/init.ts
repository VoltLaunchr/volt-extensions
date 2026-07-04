import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';
import { input, select, checkbox } from '@inquirer/prompts';
import { VALID_CATEGORIES, VALID_PERMISSIONS, KEBAB_CASE_REGEX } from '../constants.js';
import { scaffoldExtension, type TemplateOptions } from '../utils/template.js';
import * as log from '../utils/logger.js';

function getGitConfig(key: string): string {
  try {
    return execFileSync('git', ['config', '--get', key], {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return '';
  }
}

function detectPackageManager(): string {
  try {
    execFileSync('bun', ['--version'], { stdio: 'ignore' });
    return 'bun';
  } catch {
    // fall through
  }
  try {
    execFileSync('pnpm', ['--version'], { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    // fall through
  }
  return 'npm';
}

export async function initCommand(nameArg?: string): Promise<void> {
  log.heading('Create a new Volt extension');

  const defaultName = nameArg || basename(process.cwd());

  const id = await input({
    message: 'Extension ID (kebab-case):',
    default: defaultName,
    validate: (val) =>
      KEBAB_CASE_REGEX.test(val)
        ? true
        : 'Must be kebab-case (lowercase letters, numbers, hyphens)',
  });

  const name = await input({
    message: 'Display name:',
    default: id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  });

  const description = await input({
    message: 'Description:',
    default: `A Volt extension`,
  });

  const authorName = await input({
    message: 'Author name:',
    default: getGitConfig('user.name') || undefined,
  });

  const authorGithub = await input({
    message: 'GitHub username (optional):',
    default: '',
  });

  const category = await select({
    message: 'Category:',
    choices: VALID_CATEGORIES.map((c) => ({ value: c, name: c })),
    default: 'utilities',
  });

  const permissions = await checkbox({
    message: 'Permissions needed:',
    choices: VALID_PERMISSIONS.map((p) => ({ value: p, name: p })),
  });

  const prefix = await input({
    message: 'Trigger prefix (optional, e.g. "pass"):',
    default: '',
  });

  const keywordsRaw = await input({
    message: 'Keywords (comma-separated):',
    default: id,
  });

  const keywords = keywordsRaw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const opts: TemplateOptions = {
    id,
    name,
    description,
    author: {
      name: authorName,
      ...(authorGithub ? { github: authorGithub } : {}),
    },
    category,
    permissions,
    prefix: prefix || undefined,
    keywords,
  };

  const targetDir = join(process.cwd(), id);

  if (existsSync(targetDir)) {
    log.error(`Directory "${id}" already exists.`);
    process.exit(1);
  }

  log.info(`Scaffolding extension in ${log.bold(targetDir)}...`);
  scaffoldExtension(targetDir, opts);

  // Install dependencies
  const pm = detectPackageManager();
  log.info(`Installing dependencies with ${pm}...`);
  try {
    execFileSync(pm, ['install'], {
      cwd: targetDir,
      stdio: 'inherit',
    });
  } catch {
    log.warn('Dependency installation failed. Run it manually.');
  }

  console.log('');
  log.success(`Extension "${name}" created!`);
  console.log('');
  console.log(`  ${log.bold('cd ' + id)}`);
  console.log(`  ${log.dim('Edit index.ts to implement your plugin')}`);
  console.log(`  ${log.bold('volt-plugin test')}   ${log.dim('— validate your extension')}`);
  console.log(
    `  ${log.bold('volt-plugin publish')} ${log.dim('— package for distribution')}`
  );
  console.log('');
}
