const { test } = require('../../util/mapbox-gl-js-test');
const browser = require('../../../src/util/browser');

test('browser', async t => {
  await t.test('frame', (t, done) => {
    const id = browser.frame(() => {
      t.pass('called frame');
      t.ok(id, 'returns id');
      done();
    });
  });

  await t.test('now', t => {
    t.equal(typeof browser.now(), 'number');
  });

  await t.test('cancelFrame', t => {
    const id = browser.frame(() => {
      t.fail();
    });
    browser.cancelFrame(id);
  });

  await t.test('devicePixelRatio', t => {
    t.equal(typeof browser.devicePixelRatio, 'number');
  });

  await t.test('hardwareConcurrency', t => {
    t.equal(typeof browser.hardwareConcurrency, 'number');
  });
});
