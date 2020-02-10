const { join } = require('path');
const { glob, diff } = require('./lib/utils');

exports.up = async function (opts={}) {
	const migrations = await glob(opts.dir, opts.cwd);

	// TODO
	// const client = opts.client || await detect(cwd);
	// if (!client) return console.error('Could not find DB driver'); // TODO
	const file = join(__dirname, 'clients', 'postgres');
	const driver = require(file);

	let client;

	try {
		// Open new conn; setup table
		client = await driver.connect();
		const exists = await driver.setup(client);

		// console.log('\n\n~> exists', exists);
		// console.log('\n\n~> migrations', migrations);

		const fresh = diff(exists, migrations);
		const toRun = opts.single ? [fresh[0]] : fresh;

		// console.log('~> to run', toRun);

		await driver.loop(client, toRun, 'up');
		console.log('DONE');
	} catch (err) {
		// todo: pretty print
		console.error('SOMETHING HAPPENED', err);
	} finally {
		if (client) await driver.end(client);
	}
}

exports.down = async function (opts={}) {
	//
}
