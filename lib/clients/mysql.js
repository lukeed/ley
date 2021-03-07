const { load, MigrationError } = require('../util');
const TEXT = require('../text');

function run(client, text, values=[]) {
	return new Promise((res, rej) => {
		client.query(text, values, (err, rows) => {
			return err ? rej(err) : res(rows);
		});
	});
}

exports.connect = async function (opts={}) {
	const mysql = require('mysql');
	const client = mysql.createConnection(opts);
	client.run = run.bind(run, client);
	client.connect();
	return client;
}

exports.setup = async function (client) {
	await client.run(TEXT.table);
	return client.run(TEXT.exists);
};

exports.loop = async function (client, files, method) {
	try {
		await client.run('START TRANSACTION;');

		for (const obj of files) {
			const file = await load(obj.abs);
			if (typeof file[method] === 'function') {
				await Promise.resolve(file[method](client)).catch(err => {
					throw new MigrationError(err, obj);
				});
			}
			if (method === 'up') {
				await client.run('insert into migrations (name,created_at) values (?,now());', [obj.name]);
			} else if (method === 'down') {
				await client.run('delete from migrations where name = ?;', [obj.name]);
			}
		}

		await client.run('COMMIT;');
	} catch (err) {
		await client.run('ROLLBACK;');
		throw err;
	}
}

exports.end = async function (client) {
	client.destroy();
}
