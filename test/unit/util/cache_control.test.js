'use strict';
// @flow

const test = require('mapbox-gl-js-test').test;
const cacheControl = require('../../../src/util/cache_control');

test('cache_control', (t) => {
    t.test('parseCacheControl', (t) => {
        t.test('max-age', (t) => {
            t.deepEqual(cacheControl.parse('max-age=123456789'), {
                'max-age': 123456789
            }, 'returns valid max-age header');

            t.deepEqual(cacheControl.parse('max-age=1000'), {
                'max-age': 1000
            }, 'returns valid max-age header');

            t.deepEqual(cacheControl.parse('max-age=null'), {}, 'does not return invalid max-age header');

            t.end();
        });

        t.end();
    });

    t.end();
});
