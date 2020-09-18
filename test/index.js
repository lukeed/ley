const { test } = require('uvu');
const assert = require('uvu/assert');
const ley = require('..');

test('exports', () => {
	assert.type(ley, 'object');
	assert.type(ley.up, 'function');
	assert.type(ley.down, 'function');
});

test.run();
