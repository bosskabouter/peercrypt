'use strict';

const offlineServer = require('..');
const assert = require('assert').strict;


test('should first', () => { 
    assert.strictEqual(offlineServer(), 'Hello from offlineServer');
    console.info('offlineServer tests passed');
 })