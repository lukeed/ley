export async function up (sql) {
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

	await sql`
		create table if not exists todos (
			id serial primary key,
			name varchar(255) NOT NULL,
			completed boolean default false,
			created_at timestamp with time zone default now()
		);
	`;

	await sql`
		insert into todos ${
			sql(items, 'name', 'completed')
		}
	`;
}

export async function down (sql) {
	console.log('hello from inside :: 001 @ down');
	await sql`drop table if exists todos`;
}
