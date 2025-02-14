const { test } = require('mapbox-gl-js-test');
const Worker = require('../../../src/source/worker');

const _self = {
  addEventListener: function () {}
};

test('load tile', async t => {
  await t.test('calls callback on error', (t, done) => {
    const worker = new Worker(_self);
    worker.loadTile(
      0,
      {
        type: 'vector',
        source: 'source',
        uid: 0,
        tileID: { overscaledZ: 0, wrap: 0, canonical: { x: 0, y: 0, z: 0, w: 0 } }
      },
      err => {
        t.ok(err);
        done();
      }
    );
  });
});

test("isolates different instances' data", t => {
  const worker = new Worker(_self);

  worker.setLayers(0, [{ id: 'one', type: 'circle' }], () => {});

  worker.setLayers(
    1,
    [
      { id: 'one', type: 'circle' },
      { id: 'two', type: 'circle' }
    ],
    () => {}
  );

  t.notEqual(worker.layerIndexes[0], worker.layerIndexes[1]);
});

test('worker source messages dispatched to the correct map instance', (t, done) => {
  const worker = new Worker(_self);

  worker.actor.send = function (type, data, callback, mapId) {
    t.equal(type, 'main thread task');
    t.equal(mapId, 999);
    done();
  };

  _self.registerWorkerSource('test', function (actor) {
    this.loadTile = function () {
      // we expect the map id to get appended in the call to the "real"
      // actor.send()
      actor.send('main thread task', {}, () => {}, null);
    };
  });

  worker.loadTile(999, { type: 'test' });
});
