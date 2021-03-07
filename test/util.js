const { test } = require('uvu');
const assert = require('uvu/assert');
const { join, isAbsolute } = require('path');
const $ = require('../lib/util');

const cwd = join(__dirname, 'fixtures', 'pg');
const dir = join(cwd, 'migrations');

test('(utils) glob', async () => {
	const out = await $.glob(dir);
	assert.ok(Array.isArray(out), 'returns Promise<Array>');
	assert.is(out.length, 6, '~> has 6 items');

	const first = out[0];
	assert.type(first, 'object', 'items are objects');
	assert.type(first.name, 'string', '~> has "name" string');
	assert.type(first.abs, 'string', '~> has "abs" string');
	assert.ok(isAbsolute(first.abs), '~~> is absolute path');

	const names = out.map(x => x.name);
	const expects = ['001.js', '002.js', '003.js', '004.js', '005.js', '006.js'];
	assert.equal(names, expects, '~> file order is expected');
});


test('(utils) glob :: throws', async () => {
	let caught = false;

	try {
		await $.glob(join(cwd, 'foobar'));
		assert.unreachable('should not run');
	} catch (err) {
		assert.instance(err, Error, 'throws an Error');
		assert.is(err.code, 'ENOENT', '~> is "ENOENT" code');
		assert.ok(err.stack.includes('no such file or directory'), '~> has detail');
		caught = true;
	}

	assert.ok(caught);
});


test('(utils) diff', () => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003', '004', '005'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.ok(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	assert.is(output.length, 2, '~> has 2 NEW items');

	const names = output.map(x => x.name);
	assert.equal(names, ['004', '005']);
});


test('(utils) diff :: identical', () => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.is(output.length, 0, '~> has 0 NEW items');
});


test('(utils) diff :: throws sequence error', () => {
	let caught = false;

	try {
		const exists = ['001', '003'].map(name => ({ name }));
		const locals = ['001', '002', '003'].map(name => ({ name }));

		$.diff(exists, locals);
		assert.unreachable('SHOULD NOT REACH');
	} catch (err) {
		caught = true;
		assert.instance(err, Error, 'throws an Error');
		assert.is(err.message, `Cannot run "002" after "003" has been applied`);
		assert.ok(err.stack.length > err.message.length, '~> has "stack" details');
	}

	assert.ok(caught);
});


// Note: Arrays are received in reverse
test('(utils) pluck', () => {
	// should return everything, in sync
	const foobar = ['003', '002', '001'];

	const exists = foobar.map(name => ({ name }));
	const locals = foobar.map(name => ({ name }));

	const output = $.pluck(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.ok(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	assert.is(output.length, 3, '~> has 3 candidates');

	const names = output.map(x => x.name);
	assert.equal(names, foobar);
});


// Note: Arrays are received in reverse
test('(utils) pluck :: locals >> exists', () => {
	// should NOT return items that don't exist yet
	const exists = ['003', '002', '001'].map(name => ({ name }));
	const locals = ['005', '004', '003', '002', '001'].map(name => ({ name }));

	const output = $.pluck(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.ok(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	assert.is(output.length, 3, '~> has 3 candidates');

	const names = output.map(x => x.name);
	assert.equal(names, ['003', '002', '001']);
});


// Note: Arrays are received in reverse
test('(utils) pluck :: exists >> locals :: throws', () => {
	let caught = false;

	try {
		// throws error because we don't have 005 definitions
		const exists = ['005', '004', '003', '002', '001'].map(name => ({ name }));
		const locals = ['003', '002', '001'].map(name => ({ name }));

		$.pluck(exists, locals);
		assert.unreachable('SHOULD NOT REACH');
	} catch (err) {
		caught = true;
		assert.instance(err, Error, 'throws an Error');
		assert.is(err.message, `Cannot find "005" migration file`);
		assert.ok(err.stack.length > err.message.length, '~> has "stack" details');
	}

	assert.ok(caught);
});


test('(utils) exists :: success', () => {
	const output = $.exists('uvu');
	assert.type(output, 'string', 'returns string (success)');
	assert.is(output, require.resolve('uvu'))
});


test('(utils) exists :: failure', () => {
	const output = $.exists('foobar');
	assert.type(output, 'boolean', 'returns boolean (fail)');
	assert.is(output, false)
});


test('(utils) exists :: failure :: relative', () => {
	const output = $.exists('./foobar');
	assert.type(output, 'boolean', 'returns boolean (fail)');
	assert.is(output, false)
});


test('(utils) detect', () => {
	const ORDER = ['postgres', 'pg', 'mysql', 'mysql2', 'better-sqlite3'];

	const seen = [];
	const prev = $.exists;

	// @ts-ignore
	$.exists = x => {
		seen.push(x);
	}

	const foo = $.detect();
	assert.is(foo, undefined, 'returns undefined (failure)');
	assert.equal(seen, ORDER, '~> looks for drivers (ordered)');

	// @ts-ignore
	$.exists = x => x === 'pg';
	const bar = $.detect();
	assert.is(bar, 'pg', '~> found "pg" (mock)');

	$.exists = prev;
});


test('(utils) local :: success', async () => {
	const output = await $.local('index.js'); // root/index.js
	assert.type(output, 'object', '~> returns _something_ if exists');
	assert.type(output.down, 'function', '~> had "down" export');
	assert.type(output.up, 'function', '~> had "up" export')
});


test('(utils) local :: success w/ cwd', async () => {
	const output = await $.local('util.js', __dirname); // this file
	assert.type(output, 'object', '~> returns _something_ if exists')
});


test('(utils) local :: failure', async () => {
	const output = await $.local('foobar.ts'); // root dir
	assert.is(output, false, '~> returns `false` if not found')
});


test('(utils) local :: failure w/ cwd', async () => {
	const output = await $.local('index.js', dir); // => pg/migrations/index.js
	assert.is(output, false, '~> returns `false` if not found')
});


test('(utils) MigrationError', () => {
	const original = new Error('hello world');
	const migration = { name: '000.js', abs: 'path/to/000.js' };
	Object.assign(original, { code: 42703, position: 8, foobar: undefined });

	const error = new $.MigrationError(original, migration);
	assert.instance(error, $.MigrationError, 'is MigrationError');
	assert.instance(error, Error, '~> still inherits Error class');

	assert.ok(error.stack.length > 0, 'has "stack" trace');
	assert.ok(error.stack.length > original.stack.length, '~> is longer than original trace');
	assert.ok(error.stack.includes(original.stack), '~> contains original trace');

	assert.is(error.code, original.code, 'inherits original "code" property (custom)');
	assert.is(error.foobar, original.foobar, 'inherits original "foobar" property (custom)');
	assert.is(error.position, original.position, 'inherits original "position" property (custom)');

	assert.equal(error.migration, migration, 'attaches custom "migration" key w/ file data');
});

test('(utils) isDriver :: connect', () => {
	assert.throws(
		() => $.isDriver({}),
		'Driver must have "connect" function'
	);

	assert.throws(
		() => $.isDriver({ connect: 123 }),
		'Driver must have "connect" function'
	);
});

test('(utils) isDriver :: setup', () => {
	let noop = () => {};

	assert.throws(
		() => $.isDriver({ connect: noop }),
		'Driver must have "setup" function'
	);

	assert.throws(
		() => $.isDriver({ connect: noop, setup: 123 }),
		'Driver must have "setup" function'
	);
});

test('(utils) isDriver :: loop', () => {
	let noop = () => {};

	assert.throws(
		() => $.isDriver({ connect: noop, setup: noop }),
		'Driver must have "loop" function'
	);

	assert.throws(
		() => $.isDriver({ connect: noop, setup: noop, loop: 123 }),
		'Driver must have "loop" function'
	);
});

test('(utils) isDriver :: end', () => {
	let noop = () => {};

	assert.throws(
		() => $.isDriver({ connect: noop, setup: noop, loop: noop }),
		'Driver must have "end" function'
	);

	assert.throws(
		() => $.isDriver({ connect: noop, setup: noop, loop: noop, end: 123 }),
		'Driver must have "end" function'
	);
});

test.run();
