exports.up = async DB => {
	console.log('hello from inside :: 004 @ up');
	// await DB`select foo`;
}

exports.down = async DB => {
	console.log('hello from inside :: 004 @ down');
}
