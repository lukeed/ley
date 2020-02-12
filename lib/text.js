exports.table = `
	create table if not exists migrations (
		id serial primary key,
		name varchar(255) NOT NULL,
		created_at timestamp NOT NULL
	);
`;

exports.exists = `
	select name from migrations order by id asc;
`;
