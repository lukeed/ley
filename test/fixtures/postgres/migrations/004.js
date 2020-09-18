exports.up = async sql => {
	console.log('hello from inside :: 004 @ up');
	// await sql`select foo`;
}

exports.down = async sql => {
	console.log('hello from inside :: 004 @ down');
}
