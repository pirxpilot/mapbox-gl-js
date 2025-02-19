const { test } = require('../../util/mapbox-gl-js-test');
const GeoJSONWorkerSource = require('../../../src/source/geojson_worker_source');
const StyleLayerIndex = require('../../../src/style/style_layer_index');
const { OverscaledTileID } = require('../../../src/source/tile_id');

test('reloadTile', async t => {
  await t.test('does not rebuild vector data unless data has changed', async t => {
    const layers = [
      {
        id: 'mylayer',
        source: 'sourceId',
        type: 'symbol'
      }
    ];
    const layerIndex = new StyleLayerIndex(layers);
    const source = new GeoJSONWorkerSource(null, layerIndex);
    const originalLoadVectorData = source.loadVectorData;
    let loadVectorCallCount = 0;
    source.loadVectorData = function (params, callback) {
      loadVectorCallCount++;
      return originalLoadVectorData.call(this, params, callback);
    };
    const geoJson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    };
    const tileParams = {
      source: 'sourceId',
      uid: 0,
      tileID: new OverscaledTileID(0, 0, 0, 0, 0),
      maxZoom: 10
    };

    function addData(callback) {
      source.loadData({ source: 'sourceId', data: JSON.stringify(geoJson) }, err => {
        source.coalesce({ source: 'sourceId' });
        t.equal(err, null);
        callback();
      });
    }

    function reloadTile(callback) {
      source.reloadTile(tileParams, (err, data) => {
        t.equal(err, null);
        return callback(data);
      });
    }

    addData(() => {
      // first call should load vector data from geojson
      let firstData;
      reloadTile(data => {
        firstData = data;
      });
      t.equal(loadVectorCallCount, 1);

      // second call won't give us new rawTileData
      reloadTile(data => {
        t.notOk('rawTileData' in data);
        data.rawTileData = firstData.rawTileData;
        t.deepEqual(data, firstData);
      });

      // also shouldn't call loadVectorData again
      t.equal(loadVectorCallCount, 1);

      // replace geojson data
      addData(() => {
        // should call loadVectorData again after changing geojson data
        reloadTile(data => {
          t.ok('rawTileData' in data);
          t.deepEqual(data, firstData);
        });
        t.equal(loadVectorCallCount, 2);
        t.end();
      });
    });
  });
});

test('resourceTiming', async t => {
  const layers = [
    {
      id: 'mylayer',
      source: 'sourceId',
      type: 'symbol'
    }
  ];
  const geoJson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };

  await t.test('loadData - data', async t => {
    const layerIndex = new StyleLayerIndex(layers);
    const source = new GeoJSONWorkerSource(null, layerIndex);

    source.loadData({ source: 'testSource', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.equal(result.resourceTiming, undefined, 'no resourceTiming property when loadData is not sent a URL');
      t.end();
    });
  });
});

test('loadData', async t => {
  const layers = [
    {
      id: 'layer1',
      source: 'source1',
      type: 'symbol'
    },
    {
      id: 'layer2',
      source: 'source2',
      type: 'symbol'
    }
  ];

  const geoJson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };

  const layerIndex = new StyleLayerIndex(layers);
  function createWorker() {
    const worker = new GeoJSONWorkerSource(null, layerIndex);

    // Making the call to loadGeoJSON asynchronous
    // allows these tests to mimic a message queue building up
    // (regardless of timing)
    const originalLoadGeoJSON = worker.loadGeoJSON;
    worker.loadGeoJSON = function (params, callback) {
      setTimeout(() => {
        originalLoadGeoJSON(params, callback);
      }, 0);
    };
    return worker;
  }

  await t.test('abandons coalesced callbacks', async t => {
    // Expect first call to run, second to be abandoned,
    // and third to run in response to coalesce
    const worker = createWorker();
    worker.loadData({ source: 'source1', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.notOk(result?.abandoned);
      worker.coalesce({ source: 'source1' });
    });

    worker.loadData({ source: 'source1', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.ok(result?.abandoned);
    });

    worker.loadData({ source: 'source1', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.notOk(result?.abandoned);
      t.end();
    });
  });

  await t.test('removeSource aborts callbacks', async t => {
    // Expect:
    // First loadData starts running before removeSource arrives
    // Second loadData is pending when removeSource arrives, gets cancelled
    // removeSource is executed immediately
    // First loadData finishes running, sends results back to foreground
    const worker = createWorker();
    worker.loadData({ source: 'source1', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.notOk(result?.abandoned);
      t.end();
    });

    worker.loadData({ source: 'source1', data: JSON.stringify(geoJson) }, (err, result) => {
      t.equal(err, null);
      t.ok(result?.abandoned);
    });

    worker.removeSource({ source: 'source1' }, err => {
      t.notOk(err);
    });
  });
});
