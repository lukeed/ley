export async function up(sql) {
	console.log('hello from inside :: 004 @ up');
	// await sql`select foo`;
}

export async function down(sql) {
	console.log('hello from inside :: 004 @ down');
}
