const { test } = require('mapbox-gl-js-test');
const makeDispatcher = require('../../../src/util/dispatcher');
const WebWorker = require('../../../src/util/web_worker');
const makeWorkerPool = require('../../../src/util/worker_pool');

test('Dispatcher', async t => {
  await t.test('requests and releases workers from pool', async t => {
    const workers = [new WebWorker(), new WebWorker()];
    const targets = [];
    let removeCalled = 0;

    function Actor(target) {
      targets.push(target);
      return {
        remove: function () {
          removeCalled++;
        }
      };
    }

    const releaseCalled = [];
    const workerPool = {
      acquire: function () {
        return workers;
      },
      release: function (id) {
        releaseCalled.push(id);
      }
    };

    const dispatcher = makeDispatcher(workerPool, {}, Actor);
    t.same(targets, workers);
    dispatcher.remove();
    t.same(releaseCalled, [dispatcher.id]);
    t.equal(removeCalled, workers.length);

    t.end();
  });

  await t.test('creates Actors with unique map id', async t => {
    const ids = [];
    function Actor(target, parent, mapId) {
      ids.push(mapId);
    }

    const workerPool = makeWorkerPool(1);
    const dispatchers = [makeDispatcher(workerPool, {}, Actor), makeDispatcher(workerPool, {}, Actor)];
    t.same(
      ids,
      dispatchers.map(d => d.id)
    );

    t.end();
  });

  await t.test('#remove destroys actors', async t => {
    const actorsRemoved = [];
    function Actor() {
      return {
        remove: function () {
          actorsRemoved.push(this);
        }
      };
    }

    const workerPool = makeWorkerPool(4);
    const dispatcher = makeDispatcher(workerPool, {}, Actor);
    dispatcher.remove();
    t.equal(actorsRemoved.length, 4);
    t.end();
  });

  t.end();
});
