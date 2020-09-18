exports.up = async DB => {
	console.log('hello from inside :: 001 @ up');

	await DB.query(`
		create table if not exists todos (
			id serial primary key,
			name varchar(255) NOT NULL,
			completed boolean default false,
			created_at timestamp with time zone default now()
		);
	`);

	const items = [{
		name: 'get this working',
		completed: false,
	}, {
		name: 'test "UP" direction',
		completed: true
	}, {
		name: 'test "DOWN" direction',
		completed: false,
	}, {
		name: 'add `pg` driver',
		completed: false,
	}];

	for (const obj of items) {
		await DB.query(`insert into todos (name, completed) values ($1, $2);`, [
			obj.name, obj.completed
		]);
	}
}

exports.down = async DB => {
	console.log('hello from inside :: 001 @ down');
	await DB.query(`drop table if exists todos`);
}
