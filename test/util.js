const { suite } = require('uvu');
const semiver = require('semiver');
const assert = require('uvu/assert');
const { join, isAbsolute, resolve } = require('path');
const $ = require('../lib/util');

const fixtures = join(__dirname, 'fixtures');

const version = process.version.substring(1);
const hasImports = semiver(version, '12.0.0') > 0;

// ---

const glob = suite('$.glob', {
	dir: join(fixtures, 'pg', 'migrations')
});

glob('usage', async ctx => {
	const out = await $.glob(ctx.dir);
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

glob('throws', async ctx => {
	let caught = false;

	try {
		await $.glob(join(ctx.dir, 'foobar'));
		assert.unreachable('should not run');
	} catch (err) {
		assert.instance(err, Error, 'throws an Error');
		assert.is(err.code, 'ENOENT', '~> is "ENOENT" code');
		assert.ok(err.stack.includes('no such file or directory'), '~> has detail');
		caught = true;
	}

	assert.ok(caught);
});

glob.run();

// ---

const diff = suite('$.diff');

diff('usage', () => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003', '004', '005'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.ok(output.every(x => locals.includes(x)), '~> only returns items from `locals` list');
	assert.is(output.length, 2, '~> has 2 NEW items');

	const names = output.map(x => x.name);
	assert.equal(names, ['004', '005']);
});

diff('identical', () => {
	const exists = ['001', '002', '003'].map(name => ({ name }));
	const locals = ['001', '002', '003'].map(name => ({ name }));

	const output = $.diff(exists, locals);
	assert.ok(Array.isArray(output), 'returns an Array');
	assert.is(output.length, 0, '~> has 0 NEW items');
});

diff('throws sequence error', () => {
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

diff.run();

// ---

const pluck = suite('$.pluck');

// Note: Arrays are received in reverse
pluck('(utils) pluck', () => {
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
pluck('locals >> exists', () => {
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
pluck('exists >> locals :: throws', () => {
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

pluck.run();

// ---

const exists = suite('$.exists');

exists('success', () => {
	const output = $.exists('uvu');
	assert.type(output, 'string', 'returns string (success)');
	assert.is(output, require.resolve('uvu'))
});

exists('failure', () => {
	const output = $.exists('foobar');
	assert.type(output, 'boolean', 'returns boolean (fail)');
	assert.is(output, false)
});

exists('failure :: relative', () => {
	const output = $.exists('./foobar');
	assert.type(output, 'boolean', 'returns boolean (fail)');
	assert.is(output, false)
});

exists.run();

// ---

const detect = suite('$.detect');

detect('usage', () => {
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

detect.run();

// ---

const load = suite('$.load');

load('success', async () => {
	const input = resolve('.', 'index.js'); // root/index.js
	const output = await $.load(input);
	assert.type(output, 'object', '~> returns _something_ if exists');
	assert.type(output.down, 'function', '~> had "down" export');
	assert.type(output.up, 'function', '~> had "up" export')
});

load('success w/ cwd', async () => {
	const input = resolve(__dirname, 'util.js'); // this file
	const output = await $.load(input);
	assert.type(output, 'object', '~> returns _something_ if exists')
});

load('failure', async () => {
	const foobar = resolve('.', 'foobar.ts'); // root dir

	try {
		await $.load(foobar);
		assert.unreachable();
	} catch (err) {
		assert.instance(err, Error);
		assert.is(err.code, hasImports ? 'ERR_MODULE_NOT_FOUND' : 'MODULE_NOT_FOUND');
		assert.match(err.message, foobar);
	}
});

load.run();

// ---

const toConfig = suite('$.toConfig');

toConfig('direct :: CommonJS', async () => {
	const postgres = join(fixtures, 'postgres');
	const output = await $.toConfig('ley.config.js', postgres);

	assert.type(output, 'object');

	// when 12+ `module.exports=` ~> has `default` key
	assert.is('default' in output, hasImports);

	const contents = hasImports ? output.default : output;
	assert.type(contents, 'object');
	assert.is(contents.database, 'ley_testing');
});

if (hasImports) {
	// gave ".mjs" -> no fuzzy matching
	toConfig('direct :: ES Module', async () => {
		const postgres = join(fixtures, 'postgres.esm');
		const output = await $.toConfig('ley.config.mjs', postgres);

		assert.type(output, 'object');
		// `export default ` ~> has `default` key
		assert.is('default' in output, true);

		const contents = output.default;
		assert.is(contents.database, 'ley_testing');
	});

	// gave ".js" -> look for ".mjs" too
	toConfig('loose :: ES Module', async () => {
		const postgres = join(fixtures, 'postgres.esm');
		const output = await $.toConfig('ley.config.js', postgres);

		assert.type(output, 'object');
		// `export default ` ~> has `default` key
		assert.is('default' in output, true);

		const contents = output.default;
		assert.is(contents.database, 'ley_testing');
	});
}

// gave ".cjs" -> does not exist; no fuzzy
toConfig('direct :: failure', async () => {
	const output = await $.toConfig('foobar.cjs', fixtures);
	assert.is(output, undefined);
});

toConfig.run();

// ---

const MigrationError = suite('$.MigrationError');

MigrationError('MigrationError', () => {
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

MigrationError.run();

// ---

const isDriver = suite('$.isDriver');

isDriver('connect', () => {
	assert.throws(
		() => $.isDriver({}),
		'Driver must have "connect" function'
	);

	assert.throws(
		() => $.isDriver({ connect: 123 }),
		'Driver must have "connect" function'
	);
});

isDriver('setup', () => {
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

isDriver('loop', () => {
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

isDriver('end', () => {
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

isDriver.run();
