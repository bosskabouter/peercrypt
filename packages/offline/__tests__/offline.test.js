'use strict';

const offline = require('..');
const assert = require('assert').strict;

test('should first', () => { assert.strictEqual(offline(), 'Hello from offline');
console.info('offline tests passed');
 })