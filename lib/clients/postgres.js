const { load, MigrationError } = require('../util');
const TEXT = require('../text');

exports.connect = function (config={}) {
	return require('postgres')({
		onnotice: () => {},
		...config,
		max: 1,
	});
}

exports.setup = async function (sql) {
	await sql.unsafe(TEXT.table);
	return sql.unsafe(TEXT.exists);
};

exports.loop = function (client, files, method) {
	return client.begin(async sql => {
		for (const obj of files) {
			const file = await load(obj.abs);
			if (typeof file[method] === 'function') {
				await Promise.resolve(file[method](sql)).catch(err => {
					throw new MigrationError(err, obj);
				});
			}
			if (method === 'up') {
				await sql`insert into migrations (name,created_at) values (${obj.name},now());`
			} else if (method === 'down') {
				await sql`delete from migrations where name = ${obj.name};`
			}
		}
	});
}

exports.end = async function (sql) {
	await sql.end();
}
