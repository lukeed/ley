#!/usr/bin/env node
const sade = require('sade');
const pkg = require('./package');
const ley = require('.');

sade('ley')
	.version(pkg.version)
	.option('-c, --cwd', 'The current directory to resolve from', '.')
	.option('-d, --dir', 'The directory of migration files to run', 'migrations')
	.option('-D, --dry-run', 'TODO explanation, shows what will be done')

	.command('up')
		.describe('Run "up" migrations')
		.option('-s, --single', 'Only run a single migraton')
		.action(ley.up)

	.command('down')
		.describe('Run "down" migrations')
		.option('-a, --all', 'Run all "down" migrations')
		.option('-f, --force', 'Skip confirmation prompt')
		.action(ley.down)

	.parse(process.argv);
