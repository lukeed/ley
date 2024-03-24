const { load, MigrationError } = require('../util');
const TEXT = require('../text');

exports.connect = function (opts={}) {
	const { createClient } = require('@libsql/client');
	return createClient(opts);
}

exports.setup = async function (client) {
	await client.execute(TEXT.table.replace('serial', 'integer'));
	const results = await client.execute(`select name from migrations order by id asc`);
	return results.rows;
};

exports.loop = async function (client, files, method) {
	const INSERT = 'insert into migrations (name,created_at) values (?,current_timestamp)';
	const DELETE = 'delete from migrations where name = ?';

	const lock = await client.transaction();

	for (const obj of files) {
		const file = await load(obj.abs);
		if (typeof file[method] === 'function') {
			await Promise.resolve(file[method](client)).catch(err => {
				throw new MigrationError(err, obj);
			});
		}
		if (method === 'up') {
			client.execute({
				sql: INSERT,
				args: [obj.name],
			});
		} else if (method === 'down') {
			client.execute({
				sql: DELETE,
				args: [obj.name],
			});
		}
	}

	return lock.commit();
}

exports.end = async function (client) {
	client.close();
}
