const { join, resolve } = require('path');
const $ = require('./lib/util');

async function parse(opts) {
	const cwd = resolve(opts.cwd || '.');
	const dir = join(cwd, opts.dir);

	const migrations = await $.glob(dir);
	const lib = opts.client || await $.detect(cwd);
	if (!lib) throw new Error('Could not find DB driver'); // better msg

	const file = join(__dirname, 'clients', lib);
	const driver = require(file); // allow throw

	return { driver, migrations };
}

exports.up = async function (opts={}) {
	let client, { driver, migrations } = await parse(opts);

	try {
		// Open new conn; setup table
		client = await driver.connect();
		const exists = await driver.setup(client);

		const fresh = $.diff(exists, migrations);
		const toRun = opts.single ? [fresh[0]] : fresh;

		await driver.loop(client, toRun, 'up');
	} catch (err) {
		throw err;
	} finally {
		if (client) await driver.end(client);
	}
}

exports.down = async function (opts={}) {
	//
}
