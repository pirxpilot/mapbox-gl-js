const { test } = require('../../util/mapbox-gl-js-test');
const _window = require('../../util/window');
const makeWorkerPool = require('../../../src/util/worker_pool');

test('WorkerPool', async t => {
  let globalWindow;
  t.before(() => {
    globalWindow = globalThis.window;
    globalThis.window = _window;
  });
  t.after(() => {
    globalThis.window = globalWindow;
  });

  await t.test('#acquire', async t => {
    const pool = makeWorkerPool(4);

    t.notOk(pool.workers);
    const workers1 = pool.acquire('map-1');
    const workers2 = pool.acquire('map-2');
    t.equal(workers1.length, 4);
    t.equal(workers2.length, 4);

    // check that the two different dispatchers' workers arrays correspond
    workers1.forEach((w, i) => t.equal(w, workers2[i]));
    t.end();
  });

  await t.test('#release', async t => {
    let workersTerminated = 0;

    const pool = makeWorkerPool(4);
    pool.acquire('map-1');
    const workers = pool.acquire('map-2');
    workers.forEach(w => {
      w.terminate = function () {
        workersTerminated += 1;
      };
    });

    pool.release('map-2');
    t.comment('keeps workers if a dispatcher is still active');
    t.equal(workersTerminated, 0);

    t.comment('terminates workers if no dispatchers are active');
    pool.release('map-1');
    t.equal(workersTerminated, 4);

    t.end();
  });

  t.end();
});
