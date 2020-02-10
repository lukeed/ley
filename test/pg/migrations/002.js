const text = 'add `mysql` driver';

exports.up = async DB => {
	console.log('hello from inside :: 002 @ up');
	await DB.query('insert into todos (name) values ($1);', [text]);
}

exports.down = async DB => {
	console.log('hello from inside :: 002 @ down');
	await DB.query('delete from todos where name = $1;', [text]);
}
