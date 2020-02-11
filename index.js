const { join, resolve } = require('path');
const $ = require('./lib/util');

async function parse(opts) {
	const cwd = resolve(opts.cwd || '.');
	const dir = join(cwd, opts.dir);

	[].concat(opts.require || []).filter(Boolean).forEach(name => {
		const tmp = $.exists(name, [cwd]);
		if (!tmp) throw new Error(`Cannot find module '${name}'`);
		return require(tmp);
	});

	const migrations = await $.glob(dir);
	const lib = opts.client || await $.detect(cwd);
	if (!lib) throw new Error('Unable to locate a SQL driver');

	const file = join(__dirname, 'lib', 'clients', lib);
	const driver = require(file); // allow throw here

	return { driver, migrations };
}

exports.up = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		// Open new conn; setup table
		client = await driver.connect();
		const exists = await driver.setup(client);

		const fresh = $.diff(exists, migrations);
		if (!fresh.length) return []; // nothing to run

		const toRun = opts.single ? [fresh[0]] : fresh;
		await driver.loop(client, toRun, 'up');
		return toRun.map(x => x.name);
	} catch (err) {
		throw err;
	} finally {
		if (client) await driver.end(client);
	}
}

exports.down = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		// Open new conn; setup table
		client = await driver.connect();
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
	} catch (err) {
		throw err;
	} finally {
		if (client) await driver.end(client);
	}
}
