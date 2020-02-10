const TEXT = require('../lib/text');

exports.connect = function () {
	return require('postgres')({
		onnotice: () => {},
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
			const file = require(obj.abs);
			if (typeof file[method] === 'function') await file[method](sql);
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
