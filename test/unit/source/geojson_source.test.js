const { test } = require('../../util/mapbox-gl-js-test');
const Tile = require('../../../src/source/tile');
const { OverscaledTileID } = require('../../../src/source/tile_id');
const GeoJSONSource = require('../../../src/source/geojson_source');
const Transform = require('../../../src/geo/transform');
const LngLat = require('../../../src/geo/lng_lat');

const mockDispatcher = {
  send() {
    return Promise.resolve();
  },
  nextWorkerId() {
    return 0;
  }
};

const hawkHill = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.48369693756104, 37.83381888486939],
          [-122.48348236083984, 37.83317489144141],
          [-122.48339653015138, 37.83270036637107],
          [-122.48356819152832, 37.832056363179625],
          [-122.48404026031496, 37.83114119107971],
          [-122.48404026031496, 37.83049717427869],
          [-122.48348236083984, 37.829920943955045],
          [-122.48356819152832, 37.82954808664175],
          [-122.48507022857666, 37.82944639795659],
          [-122.48610019683838, 37.82880236636284],
          [-122.48695850372314, 37.82931081282506],
          [-122.48700141906738, 37.83080223556934],
          [-122.48751640319824, 37.83168351665737],
          [-122.48803138732912, 37.832158048267786],
          [-122.48888969421387, 37.83297152392784],
          [-122.48987674713133, 37.83263257682617],
          [-122.49043464660643, 37.832937629287755],
          [-122.49125003814696, 37.832429207817725],
          [-122.49163627624512, 37.832564787218985],
          [-122.49223709106445, 37.83337825839438],
          [-122.49378204345702, 37.83368330777276]
        ]
      }
    }
  ]
};

test('GeoJSONSource#setData', async t => {
  function createSource(opts = {}) {
    return new GeoJSONSource('id', { ...opts, data: {} }, mockDispatcher);
  }

  await t.test('returns self', t => {
    const source = createSource();
    t.assert.equal(source.setData({}), source);
  });

  await t.test('fires "data" event', async t => {
    const { promise, resolve } = Promise.withResolvers();
    const source = createSource();
    source.once('data', () => resolve());
    await source.load();
    await promise;
  });

  await t.test('fires "dataloading" event', async t => {
    const { promise, resolve } = Promise.withResolvers();
    const source = createSource();
    source.on('dataloading', () => resolve());
    await source.load();
    await promise;
  });
});

test('GeoJSONSource#onRemove', async t => {
  await t.test('broadcasts "removeSource" event', (t, done) => {
    const source = new GeoJSONSource(
      'id',
      { data: {} },
      {
        send: function (type, data, callback) {
          t.assert.notOk(callback);
          t.assert.equal(type, 'removeSource');
          t.assert.deepEqual(data, { type: 'geojson', source: 'id' });
          done();
        },
        broadcast: function () {
          // Ignore
        }
      }
    );
    source.onRemove();
  });
});

test('GeoJSONSource#update', async t => {
  const transform = new Transform();
  transform.resize(200, 200);
  const lngLat = LngLat.convert([-122.486052, 37.830348]);
  const point = transform.locationPoint(lngLat);
  transform.zoom = 15;
  transform.setLocationAtPoint(lngLat, point);

  await t.test('sends initial loadData request to dispatcher', (t, done) => {
    const mockDispatcher = {
      send(message) {
        t.assert.equal(message, 'geojson.loadData');
        done();
        return Promise.resolve();
      },
      nextWorkerId() {
        return 0;
      }
    };

    new GeoJSONSource('id', { data: {} }, mockDispatcher).load();
  });

  await t.test('forwards geojson-vt options with worker request', (t, done) => {
    const mockDispatcher = {
      send(message, params) {
        t.assert.equal(message, 'geojson.loadData');
        t.assert.deepEqual(params.geojsonVtOptions, {
          extent: 8192,
          maxZoom: 10,
          tolerance: 4,
          buffer: 256,
          lineMetrics: false
        });
        done();
        return Promise.resolve();
      },
      nextWorkerId() {
        return 0;
      }
    };

    new GeoJSONSource(
      'id',
      {
        data: {},
        maxzoom: 10,
        tolerance: 0.25,
        buffer: 16
      },
      mockDispatcher
    ).load();
  });

  await t.test('fires event when metadata loads', (t, done) => {
    const mockDispatcher = {
      send() {
        return Promise.resolve(0);
      },
      nextWorkerId() {
        return 0;
      }
    };

    const source = new GeoJSONSource('id', { data: {} }, mockDispatcher);

    source.on('data', e => {
      if (e.sourceDataType === 'metadata') {
        done();
      }
    });

    source.load();
  });

  await t.test('fires "error"', async t => {
    const mockDispatcher = {
      send() {
        throw 'error';
      },
      nextWorkerId() {
        return 0;
      }
    };

    const { resolve, promise } = Promise.withResolvers();
    const source = new GeoJSONSource('id', { data: {} }, mockDispatcher);
    source.on('error', err => {
      t.assert.equal(err.error, 'error');
      resolve();
    });
    await source.load();
    await promise;
  });

  await t.test('sends loadData request to dispatcher after data update', async t => {
    let expectedLoadDataCalls = 0;
    const mockDispatcher = {
      send(message) {
        if (message === 'geojson.loadData') {
          expectedLoadDataCalls += 1;
        }
        return Promise.resolve(0);
      },
      nextWorkerId() {
        return 0;
      }
    };

    const source = new GeoJSONSource('id', { data: {} }, mockDispatcher);
    source.map = {
      transform: {}
    };

    source.on('data', e => {
      if (e.sourceDataType === 'metadata') {
        source.setData({});
        source.loadTile(new Tile(new OverscaledTileID(0, 0, 0, 0, 0), 512), () => {});
      }
    });

    await source.load();
    t.assert.equal(expectedLoadDataCalls, 2);
  });
});

test('GeoJSONSource#serialize', async t => {
  await t.test('serialize source with inline data', async t => {
    const source = new GeoJSONSource('id', { data: hawkHill }, mockDispatcher);
    await source.load();
    t.assert.deepEqual(source.serialize(), {
      type: 'geojson',
      data: hawkHill
    });
  });

  await t.test('serialize source with url', async t => {
    const source = new GeoJSONSource('id', { data: 'local://data.json' }, mockDispatcher);
    await source.load();
    t.assert.deepEqual(source.serialize(), {
      type: 'geojson',
      data: 'local://data.json'
    });
  });

  await t.test('serialize source with updated data', async t => {
    const source = new GeoJSONSource('id', { data: {} }, mockDispatcher);
    await source.load();
    source.setData(hawkHill);
    t.assert.deepEqual(source.serialize(), {
      type: 'geojson',
      data: hawkHill
    });
  });

  await t.test('serialize source with additional options', t => {
    const source = new GeoJSONSource('id', { data: {}, cluster: true }, mockDispatcher);
    t.assert.deepEqual(source.serialize(), {
      type: 'geojson',
      data: {},
      cluster: true
    });
  });
});
