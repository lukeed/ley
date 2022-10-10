const { join, resolve } = require('path');
const { writeFileSync } = require('fs');
const { mkdir } = require('mk-dirs');
const $ = require('./lib/util');

async function parse(opts) {
	const cwd = resolve(opts.cwd || '.');
	const dir = join(cwd, opts.dir);

	[].concat(opts.require || []).filter(Boolean).forEach(name => {
		const tmp = $.exists(name);
		if (tmp) return require(tmp);
		throw new Error(`Cannot find module '${name}'`);
	});

	// cli(`--driver`) > config(exports.driver) > autodetect
	let driver = opts.driver || opts.config.driver || $.detect();
	if (!driver) throw new Error('Unable to locate a database driver');

	// allow `require` throws
	if ($.drivers.includes(driver)) {
		driver = require(join(__dirname, 'lib', 'clients', driver));
	} else {
		if (typeof driver === 'string') driver = require(driver);
		$.isDriver(driver); // throws validation error(s)
	}

	const migrations = await $.glob(dir);

	return { driver, migrations };
}

exports.up = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		// Open new conn; setup table
		client = await driver.connect(opts.config);
		const exists = await driver.setup(client);

		const fresh = $.diff(exists, migrations);
		if (!fresh.length) return []; // nothing to run

		const toRun = opts.single ? [fresh[0]] : fresh;
		await driver.loop(client, toRun, 'up');
		return toRun.map(x => x.name);
	} finally {
		if (client) await driver.end(client);
	}
}

exports.down = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		// Open new conn; setup table
		client = await driver.connect(opts.config);
		const exists = await driver.setup(client);
		if (!exists.length) return []; // nothing to undo

		exists.reverse();
		migrations.reverse();

		const last = exists[0];
		const idx = migrations.findIndex(x => x.name === last.name);
		if (idx === -1) throw new Error(`Unknown "${last.name}" migration`);

		const toRun = $.pluck(opts.all ? exists : [last], migrations.slice(idx));
		await driver.loop(client, toRun, 'down');
		return toRun.map(x => x.name);
	} finally {
		if (client) await driver.end(client);
	}
}

exports.status = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		client = await driver.connect(opts.config);
		const exists = await driver.setup(client);
		return $.diff(exists, migrations).map(x => x.name);
	} finally {
		if (client) await driver.end(client);
	}
}

exports.new = async function (opts={}) {
	let { migrations } = await parse(opts);

	let prefix = '';
	if (opts.timestamp) {
		prefix += Date.now() / 1e3 | 0;
	} else {
		let tmp = migrations.pop();
		if (tmp && /^\d+/.test(tmp.name)) {
			tmp = parseInt(tmp.name.match(/^\d+/)[0], 10);
			prefix = String(tmp + 1).padStart(opts.length, '0');
		} else {
			prefix = '0'.repeat(opts.length);
		}
	}

	let filename = prefix + '-' + opts.filename.replace(/\s+/g, '-');
	if (!/\.\w+$/.test(filename)) filename += opts.esm ? '.mjs' : '.js';
	let dir = resolve(opts.cwd || '.', opts.dir);
	let file = join(dir, filename);

	let str = '';
	await mkdir(dir);
	
	if (opts.esm) {
		str += 'export async function up(client) {\n\n}\n\n';
		str += 'export async function down(client) {\n\n}\n';
	} else {
		str += 'exports.up = async client => {\n\n};\n\n';
		str += 'exports.down = async client => {\n\n};\n';
	}
	writeFileSync(file, str);

	return filename;
}
