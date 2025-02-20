const { test } = require('../util/mapbox-gl-js-test');
const mapboxgl = require('../../src');

test('mapboxgl', async t => {
  await t.test('version', t => {
    t.assert.ok(mapboxgl.version);
  });

  await t.test('workerCount', t => {
    t.assert.ok(typeof mapboxgl.workerCount === 'number');
  });
});
