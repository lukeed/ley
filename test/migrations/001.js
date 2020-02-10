exports.up = async DB => {
	console.log('hello from inside :: 001 @ up');

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

	await DB`
		create table if not exists todos (
			id serial primary key,
			name varchar(255) NOT NULL,
			completed boolean default false,
			created_at timestamp with time zone default now()
		);
	`;

	await DB`
		insert into todos ${
			DB(items, 'name', 'completed')
		}
	`;
}

exports.down = async DB => {
	console.log('hello from inside :: 001 @ down');
	await DB`drop table if exists todos`;
}
