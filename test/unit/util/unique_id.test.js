'use strict';

const test = require('mapbox-gl-js-test').test;
const uniqueId = require('../../../src/util/unique_id');

test('unique_id', async t => {
  t.ok(typeof uniqueId() === 'number', 'uniqueId');
  t.ok(uniqueId() !== uniqueId(), 'uniqueId');
  t.end();
});
