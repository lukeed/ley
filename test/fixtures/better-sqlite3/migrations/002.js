const text = 'add `mysql` driver';

exports.up = DB => {
	console.log('hello from inside :: 002 @ up');
	DB.prepare('insert into todos (name) values (?);').run(text);
}

exports.down = DB => {
	console.log('hello from inside :: 002 @ down');
	DB.prepare('delete from todos where name = ?;').run(text);
}
