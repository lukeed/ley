const text = 'add `mysql` driver';

exports.up = async sql => {
	console.log('hello from inside :: 002 @ up');
	await sql`insert into todos (name) values (${text});`;
}

exports.down = async sql => {
	console.log('hello from inside :: 002 @ down');
	await sql`delete from todos where name = ${text};`;
}
