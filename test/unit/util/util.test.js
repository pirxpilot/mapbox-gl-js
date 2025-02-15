const { test } = require('../../util/mapbox-gl-js-test');

const Coordinate = require('../../../src/geo/coordinate');
const {
  easeCubicInOut,
  getCoordinatesCenter,
  clamp,
  wrap,
  bezier,
  isCounterClockwise,
  isClosedPolygon
} = require('../../../src/util/util');
const Point = require('@mapbox/point-geometry');

test('util', async t => {
  t.equal(easeCubicInOut(0), 0, 'easeCubicInOut=0');
  t.equal(easeCubicInOut(0.2), 0.03200000000000001);
  t.equal(easeCubicInOut(0.5), 0.5, 'easeCubicInOut=0.5');
  t.equal(easeCubicInOut(1), 1, 'easeCubicInOut=1');

  await t.test('getCoordinatesCenter', async t => {
    t.deepEqual(getCoordinatesCenter([new Coordinate(0, 0, 2), new Coordinate(1, 1, 2)]), new Coordinate(0.5, 0.5, 0));
    t.end();
  });

  await t.test('clamp', async t => {
    t.equal(clamp(0, 0, 1), 0);
    t.equal(clamp(1, 0, 1), 1);
    t.equal(clamp(200, 0, 180), 180);
    t.equal(clamp(-200, 0, 180), 0);
    t.end();
  });

  await t.test('wrap', async t => {
    t.equal(wrap(0, 0, 1), 1);
    t.equal(wrap(1, 0, 1), 1);
    t.equal(wrap(200, 0, 180), 20);
    t.equal(wrap(-200, 0, 180), 160);
    t.end();
  });

  await t.test('bezier', async t => {
    const curve = bezier(0, 0, 0.25, 1);
    t.ok(curve instanceof Function, 'returns a function');
    t.equal(curve(0), 0);
    t.equal(curve(1), 1);
    t.equal(curve(0.5), 0.8230854638965502);
    t.end();
  });

  await t.test('isCounterClockwise ', async t => {
    await t.test('counter clockwise', async t => {
      const a = new Point(0, 0);
      const b = new Point(1, 0);
      const c = new Point(1, 1);

      t.equal(isCounterClockwise(a, b, c), true);
      t.end();
    });

    await t.test('clockwise', async t => {
      const a = new Point(0, 0);
      const b = new Point(1, 0);
      const c = new Point(1, 1);

      t.equal(isCounterClockwise(c, b, a), false);
      t.end();
    });

    t.end();
  });

  await t.test('isClosedPolygon', async t => {
    await t.test('not enough points', async t => {
      const polygon = [new Point(0, 0), new Point(1, 0), new Point(0, 1)];

      t.equal(isClosedPolygon(polygon), false);
      t.end();
    });

    await t.test('not equal first + last point', async t => {
      const polygon = [new Point(0, 0), new Point(1, 0), new Point(0, 1), new Point(1, 1)];

      t.equal(isClosedPolygon(polygon), false);
      t.end();
    });

    await t.test('closed polygon', async t => {
      const polygon = [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, 1), new Point(0, 0)];

      t.equal(isClosedPolygon(polygon), true);
      t.end();
    });

    t.end();
  });

  t.end();
});
