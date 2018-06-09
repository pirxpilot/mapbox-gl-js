const { test } = require('mapbox-gl-js-test');
const VectorTileWorkerSource = require('../../../src/source/vector_tile_worker_source');
const StyleLayerIndex = require('../../../src/style/style_layer_index');

test('VectorTileWorkerSource#abortTile aborts pending request', (t) => {
    const source = new VectorTileWorkerSource(null, new StyleLayerIndex());

    source.loadTile({
        source: 'source',
        uid: 0,
        tileID: { overscaledZ: 0, wrap: 0, canonical: {x: 0, y: 0, z: 0, w: 0} },
        request: { url: 'http://localhost:2900/abort' }
    }, (err, res) => {
        t.false(err);
        t.false(res);
    });

    source.abortTile({
        source: 'source',
        uid: 0
    }, (err, res) => {
        t.false(err);
        t.false(res);
    });

    t.deepEqual(source.loading, {});
    t.end();
});

test('VectorTileWorkerSource#removeTile removes loaded tile', (t) => {
    const source = new VectorTileWorkerSource(null, new StyleLayerIndex());

    source.loaded = {
        '0': {}
    };

    source.removeTile({
        source: 'source',
        uid: 0
    }, (err, res) => {
        t.false(err);
        t.false(res);
    });

    t.deepEqual(source.loaded, {});
    t.end();
});

test('VectorTileWorkerSource#reloadTile reloads a previously-loaded tile', (t) => {
    const source = new VectorTileWorkerSource(null, new StyleLayerIndex());
    const parse = t.spy();

    source.loaded = {
        '0': {
            status: 'done',
            parse
        }
    };

    const callback = t.spy();
    source.reloadTile({ uid: 0 }, callback);
    t.equal(parse.callCount, 1);

    parse.firstCall.args[3]();
    t.equal(callback.callCount, 1);

    t.end();
});

test('VectorTileWorkerSource#reloadTile queues a reload when parsing is in progress', (t) => {
    const source = new VectorTileWorkerSource(null, new StyleLayerIndex());
    const parse = t.spy();

    source.loaded = {
        '0': {
            status: 'done',
            parse
        }
    };

    const callback1 = t.spy();
    const callback2 = t.spy();
    source.reloadTile({ uid: 0 }, callback1);
    t.equal(parse.callCount, 1);

    source.loaded[0].status = 'parsing';
    source.reloadTile({ uid: 0 }, callback2);
    t.equal(parse.callCount, 1);

    parse.firstCall.args[3]();
    t.equal(parse.callCount, 2);
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 0);

    parse.secondCall.args[3]();
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 1);

    t.end();
});

test('VectorTileWorkerSource#reloadTile handles multiple pending reloads', (t) => {
    // https://github.com/mapbox/mapbox-gl-js/issues/6308
    const source = new VectorTileWorkerSource(null, new StyleLayerIndex());
    const parse = t.spy();

    source.loaded = {
        '0': {
            status: 'done',
            parse
        }
    };

    const callback1 = t.spy();
    const callback2 = t.spy();
    const callback3 = t.spy();
    source.reloadTile({ uid: 0 }, callback1);
    t.equal(parse.callCount, 1);

    source.loaded[0].status = 'parsing';
    source.reloadTile({ uid: 0 }, callback2);
    t.equal(parse.callCount, 1);

    parse.firstCall.args[3]();
    t.equal(parse.callCount, 2);
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 0);
    t.equal(callback3.callCount, 0);

    source.reloadTile({ uid: 0 }, callback3);
    t.equal(parse.callCount, 2);
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 0);
    t.equal(callback3.callCount, 0);

    parse.secondCall.args[3]();
    t.equal(parse.callCount, 3);
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 1);
    t.equal(callback3.callCount, 0);

    parse.thirdCall.args[3]();
    t.equal(callback1.callCount, 1);
    t.equal(callback2.callCount, 1);
    t.equal(callback3.callCount, 1);

    t.end();
});
