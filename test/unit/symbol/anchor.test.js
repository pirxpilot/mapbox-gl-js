const { test } = require('mapbox-gl-js-test');
const Anchor = require('../../../src/symbol/anchor');

test('Anchor', async (t) => {
    await t.test('#constructor', async (t) => {
        t.ok(new Anchor(0, 0, 0, []) instanceof Anchor, 'creates an object');
        t.ok(new Anchor(0, 0, 0, [], []) instanceof Anchor, 'creates an object with a segment');
        t.end();
    });
    await t.test('#clone', async (t) => {
        const a = new Anchor(1, 2, 3, []);
        const b = new Anchor(1, 2, 3, []);
        t.deepEqual(a.clone(), b);
        t.deepEqual(a.clone(), a);
        t.end();
    });

    t.end();
});
