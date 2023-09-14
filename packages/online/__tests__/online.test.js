'use strict';

const online = require('..');
const assert = require('assert').strict;

test('should first', () => { assert.strictEqual(online(), 'Hello from online');
console.info('online tests passed');
 })