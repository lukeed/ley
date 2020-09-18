exports.up = DB => {
	console.log('hello from inside :: 004 @ up');
	// DB.prepare(`select foo`).run(); // throws
}

exports.down = DB => {
	console.log('hello from inside :: 004 @ down');
}
