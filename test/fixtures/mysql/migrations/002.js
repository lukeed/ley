const text = 'add `mysql` driver';

exports.up = async DB => {
	console.log('hello from inside :: 002 @ up');
	await DB.run('insert into todos (name) values (?);', [text]);
}

exports.down = async DB => {
	console.log('hello from inside :: 002 @ down');
	await DB.run('delete from todos where name = ?;', [text]);
}
