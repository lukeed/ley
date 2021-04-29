const text = 'add `mysql` driver';

export async function up(sql) {
	console.log('hello from inside :: 002 @ up');
	await sql`insert into todos (name) values (${text});`;
}

export async function down(sql) {
	console.log('hello from inside :: 002 @ down');
	await sql`delete from todos where name = ${text};`;
}
