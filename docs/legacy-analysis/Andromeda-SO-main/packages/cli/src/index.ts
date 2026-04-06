#!/usr/bin/env node
import { program } from 'commander';
import { agentsExport } from './commands/agents.export';
import { agentsImport } from './commands/agents.import';
import { i18nLocales } from './commands/i18n.locales';
import { i18nSeed } from './commands/i18n.seed';

program
    .name('andromeda')
    .description('Andromeda OS CLI')
    .version('0.1.0');

program
    .command('agents export <agentId>')
    .description('Export an agent to a portable bundle file')
    .option('-o, --output <path>', 'Output file path')
    .option('--include-knowledge', 'Include knowledge collections')
    .option('--no-include-versions', 'Exclude version history')
    .action(agentsExport);

program
    .command('agents import <file>')
    .description('Import an agent from a bundle file')
    .option('--conflict <policy>', 'Conflict policy: abort|rename|overwrite', 'abort')
    .action(agentsImport);

program
    .command('i18n locales')
    .description('List available locales')
    .action(i18nLocales);

program
    .command('i18n seed')
    .description('Show i18n messages for a locale')
    .option('--locale <code>', 'Locale code', 'pt-BR')
    .option('--category <category>', 'Filter by category')
    .action(i18nSeed);

program.parse();