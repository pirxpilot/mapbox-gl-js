'use strict';
// @flow

const test = require('mapbox-gl-js-test').test;
const Coordinate = require('../../../src/geo/coordinate');
const util = require('../../../src/util/util');
const Point = require('point-geometry');

test('util', (t) => {
    t.equal(util.easeCubicInOut(0), 0, 'easeCubicInOut=0');
    t.equal(util.easeCubicInOut(0.2), 0.03200000000000001);
    t.equal(util.easeCubicInOut(0.5), 0.5, 'easeCubicInOut=0.5');
    t.equal(util.easeCubicInOut(1), 1, 'easeCubicInOut=1');
    t.ok(typeof util.uniqueId() === 'number', 'uniqueId');

    t.test('getCoordinatesCenter', (t) => {
        t.deepEqual(util.getCoordinatesCenter(
            [
                new Coordinate(0, 0, 2),
                new Coordinate(1, 1, 2)
            ]),
            new Coordinate(0.5, 0.5, 0));
        t.end();
    });

    t.test('asyncAll - sync', (t) => {
        t.equal(util.asyncAll([0, 1, 2], (data, callback) => {
            callback(null, data);
        }, (err, results) => {
            t.ifError(err);
            t.deepEqual(results, [0, 1, 2]);
        }));
        t.end();
    });

    t.test('asyncAll - async', (t) => {
        t.equal(util.asyncAll([4, 0, 1, 2], (data, callback) => {
            setTimeout(() => {
                callback(null, data);
            }, data);
        }, (err, results) => {
            t.ifError(err);
            t.deepEqual(results, [4, 0, 1, 2]);
            t.end();
        }));
    });

    t.test('asyncAll - error', (t) => {
        t.equal(util.asyncAll([4, 0, 1, 2], (data, callback) => {
            setTimeout(() => {
                callback(new Error('hi'), data);
            }, data);
        }, (err, results) => {
            t.equal(err && err.message, 'hi');
            t.deepEqual(results, [4, 0, 1, 2]);
            t.end();
        }));
    });

    t.test('asyncAll - empty', (t) => {
        t.equal(util.asyncAll([], (data, callback) => {
            callback(null, 'foo');
        }, (err, results) => {
            t.ifError(err);
            t.deepEqual(results, []);
        }));
        t.end();
    });

    t.test('clamp', (t) => {
        t.equal(util.clamp(0, 0, 1), 0);
        t.equal(util.clamp(1, 0, 1), 1);
        t.equal(util.clamp(200, 0, 180), 180);
        t.equal(util.clamp(-200, 0, 180), 0);
        t.end();
    });

    t.test('wrap', (t) => {
        t.equal(util.wrap(0, 0, 1), 1);
        t.equal(util.wrap(1, 0, 1), 1);
        t.equal(util.wrap(200, 0, 180), 20);
        t.equal(util.wrap(-200, 0, 180), 160);
        t.end();
    });

    t.test('bezier', (t) => {
        const curve = util.bezier(0, 0, 0.25, 1);
        t.ok(curve instanceof Function, 'returns a function');
        t.equal(curve(0), 0);
        t.equal(curve(1), 1);
        t.equal(curve(0.5), 0.8230854638965502);
        t.end();
    });

    t.test('asyncAll', (t) => {
        let expect = 1;
        util.asyncAll([], (callback) => { callback(); }, () => {
            t.ok('immediate callback');
        });
        util.asyncAll([1, 2, 3], (number, callback) => {
            t.equal(number, expect++);
            t.ok(callback instanceof Function);
            callback(null, 0);
        }, () => {
            t.end();
        });
    });

    t.test('isCounterClockwise ', (t) => {
        t.test('counter clockwise', (t) => {
            const a = new Point(0, 0);
            const b = new Point(1, 0);
            const c = new Point(1, 1);

            t.equal(util.isCounterClockwise(a, b, c), true);
            t.end();
        });

        t.test('clockwise', (t) => {
            const a = new Point(0, 0);
            const b = new Point(1, 0);
            const c = new Point(1, 1);

            t.equal(util.isCounterClockwise(c, b, a), false);
            t.end();
        });

        t.end();
    });

    t.test('isClosedPolygon', (t) => {
        t.test('not enough points', (t) => {
            const polygon = [new Point(0, 0), new Point(1, 0), new Point(0, 1)];

            t.equal(util.isClosedPolygon(polygon), false);
            t.end();
        });

        t.test('not equal first + last point', (t) => {
            const polygon = [new Point(0, 0), new Point(1, 0), new Point(0, 1), new Point(1, 1)];

            t.equal(util.isClosedPolygon(polygon), false);
            t.end();
        });

        t.test('closed polygon', (t) => {
            const polygon = [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, 1), new Point(0, 0)];

            t.equal(util.isClosedPolygon(polygon), true);
            t.end();
        });

        t.end();
    });

    t.test('parseCacheControl', (t) => {
        t.test('max-age', (t) => {
            t.deepEqual(util.parseCacheControl('max-age=123456789'), {
                'max-age': 123456789
            }, 'returns valid max-age header');

            t.deepEqual(util.parseCacheControl('max-age=1000'), {
                'max-age': 1000
            }, 'returns valid max-age header');

            t.deepEqual(util.parseCacheControl('max-age=null'), {}, 'does not return invalid max-age header');

            t.end();
        });

        t.end();
    });

    t.end();
});
