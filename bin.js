#!/usr/bin/env node
const sade = require('sade');
const pkg = require('./package.json');
const { toConfig } = require('./lib/util');
const $ = require('./lib/log');
const ley = require('.');

function wrap(act) {
	const done = $.done.bind($, act);
	return async (opts, tmp) => {
		if (tmp = await toConfig(opts.config, opts.cwd)) {
			$.info('Loading configuration');
			opts.config = await (typeof tmp === 'function' ? tmp() : tmp)
		}
		await ley[act](opts).then(done).catch($.bail);
	};
}

sade('ley')
	.version(pkg.version)
	.option('-C, --cwd', 'The current directory to resolve from', '.')
	.option('-d, --dir', 'The directory of migration files to run', 'migrations')
	.option('-c, --config', 'Path to `ley` config file', 'ley.config.js')
	.option('-D, --driver', 'The name of a database client driver')
	.option('-r, --require', 'Additional module(s) to preload')

	.command('up')
		.describe('Run "up" migration(s). Applies all outstanding items.')
		.option('-s, --single', 'Only run a single migraton')
		.action(wrap('up'))

	.command('down')
		.describe('Run "down" migration(s). Defaults to one at a time.')
		.option('-a, --all', 'Run all "down" migrations')
		.action(wrap('down'))

	.command('status')
		.describe('Check for migration status. Counts unapplied migrations.')
		.action(wrap('status'))

	.command('new <filename>')
		.describe('Create a new migration file.')
		.option('-t, --timestamp', 'Prefix the filename with a timestamp')
		.option('-l, --length', 'The length of prefix, if not timestamp', 5)
		.action((filename, opts) => {
			opts.filename = filename;
			return wrap('new')(opts);
		})

	.parse(process.argv);
