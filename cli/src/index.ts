import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { testCommand } from './commands/test.js';
import { publishCommand } from './commands/publish.js';

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
  .action(testCommand);

program
  .command('publish')
  .description('Package extension and generate registry entry')
  .action(publishCommand);

program.parse();
