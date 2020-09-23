const { join, resolve } = require('path');
const { writeFileSync } = require('fs');
const { mkdir } = require('mk-dirs');
const $ = require('./lib/util');

async function parse(opts) {
	const cwd = resolve(opts.cwd || '.');
	const dir = join(cwd, opts.dir);

	[].concat(opts.require || []).filter(Boolean).forEach(name => {
		const tmp = $.exists(name);
		if (!tmp) throw new Error(`Cannot find module '${name}'`);
		return require(tmp);
	});

	const lib = opts.client || $.detect();
	if (!lib) throw new Error('Unable to locate a SQL driver');

	const file = join(__dirname, 'lib', 'clients', lib);
	const driver = require(file); // allow throw here

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
	if (!/\.\w+$/.test(filename)) filename += '.js';
	let dir = resolve(opts.cwd || '.', opts.dir);
	let file = join(dir, filename);

	await mkdir(dir).then(() => {
		let str = 'exports.up = async client => {\n\t// <insert magic here>\n};\n\n';
		str += 'exports.down = async client => {\n\t// just in case...\n};\n';
		writeFileSync(file, str);
	});

	return filename;
}
