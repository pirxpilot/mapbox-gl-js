const { test } = require('mapbox-gl-js-test');
const browser = require('../../../src/util/browser');

test('browser', async t => {
  await t.test('frame', async t => {
    const id = browser.frame(() => {
      t.pass('called frame');
      t.ok(id, 'returns id');
      t.end();
    });
  });

  await t.test('now', async t => {
    t.equal(typeof browser.now(), 'number');
    t.end();
  });

  await t.test('cancelFrame', async t => {
    const id = browser.frame(() => {
      t.fail();
    });
    browser.cancelFrame(id);
    t.end();
  });

  await t.test('devicePixelRatio', async t => {
    t.equal(typeof browser.devicePixelRatio, 'number');
    t.end();
  });

  await t.test('hardwareConcurrency', async t => {
    t.equal(typeof browser.hardwareConcurrency, 'number');
    t.end();
  });

  t.end();
});
