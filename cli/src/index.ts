import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { testCommand } from './commands/test.js';
import { publishCommand } from './commands/publish.js';
import { devCommand } from './commands/dev.js';
import { validateRegistryCommand } from './commands/validate-registry.js';
import { lintCommand } from './commands/lint.js';

const program = new Command();

program
  .name('volt-plugin')
  .description('CLI tool for Volt extension development')
  .version('0.1.0');

program
  .command('init [name]')
  .description('Create a new Volt extension from template')
  .action(initCommand);

program
  .command('test')
  .description('Validate and type-check your extension')
  .option('--dir <dir>', 'Extension directory', process.cwd())
  .action(testCommand);

program
  .command('lint')
  .description('Run ESLint for a Volt extension')
  .option('--dir <dir>', 'Extension directory', process.cwd())
  .action(lintCommand);

program
  .command('publish')
  .description('Package extension and generate store submission artifacts')
  .option('--dir <dir>', 'Extension directory', process.cwd())
  .option('--out-dir <dir>', 'Submission output directory')
  .action(publishCommand);

program
  .command('dev')
  .description('Watch extension for changes and hot-reload in Volt')
  .action(devCommand);

program
  .command('validate-registry')
  .description('Validate registry.json, release URLs, and source manifest drift')
  .action(validateRegistryCommand);

program.parse();
