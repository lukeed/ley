const test = require('tape');
const ley = require('..');

test('exports', t => {
	t.is(typeof ley, 'object');
	t.is(typeof ley.up, 'function');
	t.is(typeof ley.down, 'function');
	t.end();
});
