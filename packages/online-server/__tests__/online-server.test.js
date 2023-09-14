'use strict';

const onlineServer = require('..');
const assert = require('assert').strict;

test('should first', () => { assert.strictEqual(onlineServer(), 'Hello from onlineServer');
console.info('onlineServer tests passed');
 })