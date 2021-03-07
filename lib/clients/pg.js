const { load, MigrationError } = require('../util');
const TEXT = require('../text');

exports.connect = async function (opts={}) {
	const { Client } = require('pg');
	const client = new Client({ ...opts, max:1 });
	await client.connect();
	return client;
}

exports.setup = async function (client) {
	await client.query(TEXT.table);
	return client.query(TEXT.exists).then(r => r.rows);
};

exports.loop = async function (client, files, method) {
	try {
		await client.query('BEGIN');

		for (const obj of files) {
			const file = await load(obj.abs);
			if (typeof file[method] === 'function') {
				await Promise.resolve(file[method](client)).catch(err => {
					throw new MigrationError(err, obj);
				});
			}
			if (method === 'up') {
				await client.query('insert into migrations (name,created_at) values ($1,now());', [obj.name]);
			} else if (method === 'down') {
				await client.query('delete from migrations where name = $1;', [obj.name]);
			}
		}

		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	}
}

exports.end = async function (client) {
	await client.end();
}
