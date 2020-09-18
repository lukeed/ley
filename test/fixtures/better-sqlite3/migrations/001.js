exports.up = DB => {
	console.log('hello from inside :: 001 @ up');

	DB.prepare(`
		create table if not exists todos (
			id integer primary key,
			name varchar(255) NOT NULL,
			completed boolean default false,
			created_at datetime default current_timestamp
		);
	`).run();

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

	const INSERT = DB.prepare('insert into todos (name, completed) values (?,?)');
	for (const obj of items) INSERT.run([obj.name, Number(!!obj.completed)]);
}

exports.down = DB => {
	console.log('hello from inside :: 001 @ down');
	DB.prepare(`drop table if exists todos;`).run();
}
