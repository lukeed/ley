const test = require('tape');
const { join, resolve, isAbsolute } = require('path');
const $ = require('../lib/util');

const cwd = join(__dirname, 'pg');
const dir = join(cwd, 'migrations');

test('(utils) glob', async t => {
	const out = await $.glob(dir);
	t.true(Array.isArray(out), 'returns Promise<Array>');
	t.is(out.length, 6, '~> has 6 items');

	const first = out[0];
	t.is(typeof first, 'object', 'items are objects');
	t.is(typeof first.name, 'string', '~> has "name" string');
	t.is(typeof first.abs, 'string', '~> has "abs" string');
	t.true(isAbsolute(first.abs), '~~> is absolute path');

	const names = out.map(x => x.name);
	const expects = ['001.js', '002.js', '003.js', '004.js', '005.js', '006.js'];
	t.same(names, expects, '~> file order is expected');

	t.end();
});


test('(utils) glob :: throws', async t => {
	t.plan(3);

	try {
		await $.glob(join(cwd, 'foobar'));
		t.pass('should not run');
	} catch (err) {
		t.true(err instanceof Error, 'throws an Error');
		t.is(err.code, 'ENOENT', '~> is "ENOENT" code');
		t.true(err.stack.includes('no such file or directory'), '~> has detail');
	}
});


test('(utils) diff', t => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003', '004', '005'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	t.true(Array.isArray(output), 'returns an Array');
	t.true(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	t.is(output.length, 2, '~> has 2 NEW items');

	const names = output.map(x => x.name);
	t.same(names, ['004', '005']);

	t.end();
});


test('(utils) diff :: identical', t => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	t.true(Array.isArray(output), 'returns an Array');
	t.is(output.length, 0, '~> has 0 NEW items');

	t.end();
});


test('(utils) diff :: throws sequence error', t => {
	t.plan(3);

	try {
		const exists = ['001', '003'].map(name => ({ name }));
		const locals = ['001', '002', '003'].map(name => ({ name }));

		$.diff(exists, locals);
		t.pass('SHOULD NOT REACH');
	} catch (err) {
		t.true(err instanceof Error, 'throws an Error');
		t.is(err.message, `Cannot run "002" after "003" has been applied`);
		t.true(err.stack.length > err.message.length, '~> has "stack" details');
	}
});


// Note: Arrays are received in reverse
test('(utils) pluck', t => {
	// should return everything, in sync
	const foobar = ['003', '002', '001'];

	const exists = foobar.map(name => ({ name }));
	const locals = foobar.map(name => ({ name }));

	const output = $.pluck(exists, locals);
	t.true(Array.isArray(output), 'returns an Array');
	t.true(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	t.is(output.length, 3, '~> has 3 candidates');

	const names = output.map(x => x.name);
	t.same(names, foobar);

	t.end();
});


// Note: Arrays are received in reverse
test('(utils) pluck :: locals >> exists', t => {
	// should NOT return items that don't exist yet
	const exists = ['003', '002', '001'].map(name => ({ name }));
	const locals = ['005', '004', '003', '002', '001'].map(name => ({ name }));

	const output = $.pluck(exists, locals);
	t.true(Array.isArray(output), 'returns an Array');
	t.true(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	t.is(output.length, 3, '~> has 3 candidates');

	const names = output.map(x => x.name);
	t.same(names, ['003', '002', '001']);

	t.end();
});


// Note: Arrays are received in reverse
test('(utils) pluck :: exists >> locals :: throws', t => {
	t.plan(3);

	try {
		// throws error because we don't have 005 definitions
		const exists = ['005', '004', '003', '002', '001'].map(name => ({ name }));
		const locals = ['003', '002', '001'].map(name => ({ name }));

		$.pluck(exists, locals);
		t.pass('SHOULD NOT REACH');
	} catch (err) {
		t.true(err instanceof Error, 'throws an Error');
		t.is(err.message, `Cannot find "005" migration file`);
		t.true(err.stack.length > err.message.length, '~> has "stack" details');
	}
});


test('(utils) exists :: success', t => {
	const output = $.exists('tape');
	t.is(typeof output, 'string', 'returns string (success)');
	t.is(output, require.resolve('tape'));
	t.end();
});


test('(utils) exists :: failure', t => {
	const output = $.exists('foobar');
	t.is(typeof output, 'boolean', 'returns boolean (fail)');
	t.is(output, false);
	t.end();
});


test('(utils) exists :: failure :: relative', t => {
	const output = $.exists('./foobar');
	t.is(typeof output, 'boolean', 'returns boolean (fail)');
	t.is(output, false);
	t.end();
});


test('(utils) detect', t => {
	const seen = [];
	const prev = $.exists;

	$.exists = x => {
		seen.push(x);
	}

	const foo = $.detect();
	t.is(foo, undefined, 'returns undefined (failure)');
	t.same(seen, ['postgres', 'pg', 'better-sqlite3'], '~> looks for drivers (ordered)');

	$.exists = x => x === 'pg';
	const bar = $.detect();
	t.is(bar, 'pg', '~> found "pg" (mock)');

	$.exists = prev;
	t.end();
});


test('(utils) local :: success', t => {
	const output = $.local('index.js'); // root/index.js
	t.is(typeof output, 'object', '~> returns _something_ if exists');
	t.true(!!output.down, '~> had "down" export');
	t.true(!!output.up, '~> had "up" export');
	t.end();
});


test('(utils) local :: success w/ cwd', t => {
	const output = $.local('util.js', __dirname); // this file
	t.is(typeof output, 'object', '~> returns _something_ if exists');
	t.end();
});


test('(utils) local :: failure', t => {
	const output = $.local('foobar.ts'); // root dir
	t.is(output, false, '~> returns `false` if not found');
	t.end();
});


test('(utils) local :: failure w/ cwd', t => {
	const output = $.local('index.js', dir); // => pg/migrations/index.js
	t.is(output, false, '~> returns `false` if not found');
	t.end();
});


test('(utils) MigrationError', t => {
	const original = new Error('hello world');
	const migration = { name: '000.js', abs: 'path/to/000.js' };
	Object.assign(original, { code: 42703, position: 8, foobar: undefined });

	const error = new $.MigrationError(original, migration);
	t.true(error instanceof $.MigrationError, 'is MigrationError');
	t.true(error instanceof Error, '~> still inherits Error class');

	t.true(error.stack.length > 0, 'has "stack" trace');
	t.true(error.stack.length > original.stack.length, '~> is longer than original trace');
	t.true(error.stack.includes(original.stack), '~> contains original trace');

	t.is(error.code, original.code, 'inherits original "code" property (custom)');
	t.is(error.foobar, original.foobar, 'inherits original "foobar" property (custom)');
	t.is(error.position, original.position, 'inherits original "position" property (custom)');

	t.same(error.migration, migration, 'attaches custom "migration" key w/ file data');

	t.end();
});
