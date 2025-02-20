const test = require('../../util/mapbox-gl-js-test').test;
const cacheControl = require('../../../src/util/cache_control');

test('cache_control', async t => {
  await t.test('parseCacheControl', async t => {
    await t.test('max-age', t => {
      t.deepEqual(
        cacheControl.parse('max-age=123456789'),
        {
          'max-age': 123456789
        },
        'returns valid max-age header'
      );

      t.deepEqual(
        cacheControl.parse('max-age=1000'),
        {
          'max-age': 1000
        },
        'returns valid max-age header'
      );

      t.deepEqual(cacheControl.parse('max-age=null'), {}, 'does not return invalid max-age header');
    });
  });
});
