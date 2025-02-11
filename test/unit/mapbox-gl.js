const { test } = require('mapbox-gl-js-test');
const mapboxgl = require('../../src');

test('mapboxgl', async (t) => {
    await t.test('version', (t) => {
        t.ok(mapboxgl.version);
        t.end();
    });

    await t.test('workerCount', (t) => {
        t.ok(typeof mapboxgl.workerCount === 'number');
        t.end();
    });
    t.end();
});
