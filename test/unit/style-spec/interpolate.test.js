const { test } = require('../../util/mapbox-gl-js-test');
const interpolate = require('../../../src/style-spec/util/interpolate');
const Color = require('../../../src/style-spec/util/color');

test('interpolate.number', t => {
  t.assert.equal(interpolate.number(0, 1, 0.5), 0.5);
});

test('interpolate.color', t => {
  t.assert.deepEqual(interpolate.color(new Color(0, 0, 0, 0), new Color(1, 2, 3, 4), 0.5), new Color(0.5, 1, 3 / 2, 2));
});

test('interpolate.array', t => {
  t.assert.deepEqual(interpolate.array([0, 0, 0, 0], [1, 2, 3, 4], 0.5), [0.5, 1, 3 / 2, 2]);
});
