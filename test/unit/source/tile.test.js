const { test } = require('../../util/mapbox-gl-js-test');
const _window = require('../../util/window');
const Tile = require('../../../src/source/tile');
const GeoJSONWrapper = require('../../../src/source/geojson_wrapper');
const { OverscaledTileID } = require('../../../src/source/tile_id');
const fs = require('fs');
const path = require('path');
const vtpbf = require('@mapwhit/vt-pbf');
const FeatureIndex = require('../../../src/data/feature_index');
const { CollisionBoxArray } = require('../../../src/data/array_types');
const Context = require('../../../src/gl/context');
const { serialize, deserialize } = require('../../../src/util/transfer_registry');

test('Tile', async t => {
  let globalWindow;
  t.before(() => {
    globalWindow = globalThis.window;
    globalThis.window = _window;
  });
  t.after(() => {
    globalThis.window = globalWindow;
  });

  await t.test('querySourceFeatures', async t => {
    const features = [
      {
        type: 1,
        geometry: [0, 0],
        tags: { oneway: true }
      }
    ];

    await t.test('geojson tile', t => {
      const tile = new Tile(new OverscaledTileID(3, 0, 2, 1, 2));
      let result;

      result = [];
      tile.querySourceFeatures(result, {});
      t.assert.equal(result.length, 0);

      const geojsonWrapper = new GeoJSONWrapper(features);
      geojsonWrapper.name = '_geojsonTileLayer';
      tile.loadVectorData(
        createVectorData({ rawTileData: vtpbf({ layers: { _geojsonTileLayer: geojsonWrapper } }) }),
        createPainter()
      );

      result = [];
      tile.querySourceFeatures(result);
      t.assert.equal(result.length, 1);
      t.assert.deepEqual(result[0].geometry.coordinates[0], [-90, 0]);
      result = [];
      tile.querySourceFeatures(result, {});
      t.assert.equal(result.length, 1);
      t.assert.deepEqual(result[0].properties, features[0].tags);
      result = [];
      tile.querySourceFeatures(result, { filter: ['==', 'oneway', true] });
      t.assert.equal(result.length, 1);
      result = [];
      tile.querySourceFeatures(result, { filter: ['!=', 'oneway', true] });
      t.assert.equal(result.length, 0);
    });

    await t.test('empty geojson tile', t => {
      const tile = new Tile(new OverscaledTileID(1, 0, 1, 1, 1));
      let result;

      result = [];
      tile.querySourceFeatures(result, {});
      t.assert.equal(result.length, 0);

      const geojsonWrapper = new GeoJSONWrapper([]);
      geojsonWrapper.name = '_geojsonTileLayer';
      tile.rawTileData = vtpbf({ layers: { _geojsonTileLayer: geojsonWrapper } });
      result = [];
      t.assert.doesNotThrow(() => {
        tile.querySourceFeatures(result);
      });
      t.assert.equal(result.length, 0);
    });

    await t.test('vector tile', t => {
      const tile = new Tile(new OverscaledTileID(1, 0, 1, 1, 1));
      let result;

      result = [];
      tile.querySourceFeatures(result, {});
      t.assert.equal(result.length, 0);

      tile.loadVectorData(createVectorData({ rawTileData: createRawTileData() }), createPainter());

      result = [];
      tile.querySourceFeatures(result, { sourceLayer: 'does-not-exist' });
      t.assert.equal(result.length, 0);

      result = [];
      tile.querySourceFeatures(result, { sourceLayer: 'road' });
      t.assert.equal(result.length, 3);

      result = [];
      tile.querySourceFeatures(result, { sourceLayer: 'road', filter: ['==', 'class', 'main'] });
      t.assert.equal(result.length, 1);
      result = [];
      tile.querySourceFeatures(result, { sourceLayer: 'road', filter: ['!=', 'class', 'main'] });
      t.assert.equal(result.length, 2);
    });

    await t.test('loadVectorData unloads existing data before overwriting it', t => {
      const tile = new Tile(new OverscaledTileID(1, 0, 1, 1, 1));
      tile.state = 'loaded';
      t.stub(tile, 'unloadVectorData');
      const painter = {};

      tile.loadVectorData(null, painter);

      t.assert.ok(tile.unloadVectorData.calledWith());
    });

    await t.test('loadVectorData preserves the most recent rawTileData', t => {
      const tile = new Tile(new OverscaledTileID(1, 0, 1, 1, 1));
      tile.state = 'loaded';

      tile.loadVectorData(createVectorData({ rawTileData: createRawTileData() }), createPainter());
      tile.loadVectorData(createVectorData(), createPainter());

      const features = [];
      tile.querySourceFeatures(features, { sourceLayer: 'road' });
      t.assert.equal(features.length, 3);
    });
  });

  await t.test('Tile#setMask', async t => {
    await t.test('simple mask', t => {
      const tile = new Tile(0, 0, 0);
      const context = new Context(require('gl')(10, 10));
      const a = new OverscaledTileID(1, 0, 1, 0, 0);
      const b = new OverscaledTileID(1, 0, 1, 1, 1);
      const mask = {};
      mask[a.id] = a;
      mask[b.id] = b;
      tile.setMask(mask, context);
      t.assert.deepEqual(tile.mask, mask);
    });

    await t.test('complex mask', t => {
      const tile = new Tile(0, 0, 0);
      const context = new Context(require('gl')(10, 10));
      const a = new OverscaledTileID(1, 0, 1, 0, 1);
      const b = new OverscaledTileID(1, 0, 1, 1, 0);
      const c = new OverscaledTileID(2, 0, 2, 2, 3);
      const d = new OverscaledTileID(2, 0, 2, 3, 2);
      const e = new OverscaledTileID(3, 0, 3, 6, 7);
      const f = new OverscaledTileID(3, 0, 3, 7, 6);
      const mask = {};
      mask[a.id] = a;
      mask[b.id] = b;
      mask[c.id] = c;
      mask[d.id] = d;
      mask[e.id] = e;
      mask[f.id] = f;
      tile.setMask(mask, context);
      t.assert.deepEqual(tile.mask, mask);
    });
  });

  await t.test('Tile#isLessThan', async t => {
    await t.test('correctly sorts tiles', t => {
      const tiles = [
        new OverscaledTileID(9, 0, 9, 146, 195),
        new OverscaledTileID(9, 0, 9, 147, 195),
        new OverscaledTileID(9, 0, 9, 148, 195),
        new OverscaledTileID(9, 0, 9, 149, 195),
        new OverscaledTileID(9, 1, 9, 144, 196),
        new OverscaledTileID(9, 0, 9, 145, 196),
        new OverscaledTileID(9, 0, 9, 146, 196),
        new OverscaledTileID(9, 1, 9, 147, 196),
        new OverscaledTileID(9, 0, 9, 145, 194),
        new OverscaledTileID(9, 0, 9, 149, 196),
        new OverscaledTileID(10, 0, 10, 293, 391),
        new OverscaledTileID(10, 0, 10, 291, 390),
        new OverscaledTileID(10, 1, 10, 293, 390),
        new OverscaledTileID(10, 0, 10, 294, 390),
        new OverscaledTileID(10, 0, 10, 295, 390),
        new OverscaledTileID(10, 0, 10, 291, 391)
      ];

      const sortedTiles = tiles.sort((a, b) => {
        return a.isLessThan(b) ? -1 : b.isLessThan(a) ? 1 : 0;
      });

      t.assert.deepEqual(sortedTiles, [
        new OverscaledTileID(9, 0, 9, 145, 194),
        new OverscaledTileID(9, 0, 9, 145, 196),
        new OverscaledTileID(9, 0, 9, 146, 195),
        new OverscaledTileID(9, 0, 9, 146, 196),
        new OverscaledTileID(9, 0, 9, 147, 195),
        new OverscaledTileID(9, 0, 9, 148, 195),
        new OverscaledTileID(9, 0, 9, 149, 195),
        new OverscaledTileID(9, 0, 9, 149, 196),
        new OverscaledTileID(10, 0, 10, 291, 390),
        new OverscaledTileID(10, 0, 10, 291, 391),
        new OverscaledTileID(10, 0, 10, 293, 391),
        new OverscaledTileID(10, 0, 10, 294, 390),
        new OverscaledTileID(10, 0, 10, 295, 390),
        new OverscaledTileID(9, 1, 9, 144, 196),
        new OverscaledTileID(9, 1, 9, 147, 196),
        new OverscaledTileID(10, 1, 10, 293, 390)
      ]);
    });
  });
});

function createRawTileData() {
  return fs.readFileSync(path.join(__dirname, '/../../fixtures/mbsv5-6-18-23.vector.pbf'));
}

function createVectorData(options) {
  const collisionBoxArray = new CollisionBoxArray();
  return Object.assign(
    {
      collisionBoxArray: deserialize(serialize(collisionBoxArray)),
      featureIndex: deserialize(serialize(new FeatureIndex(new OverscaledTileID(1, 0, 1, 1, 1)))),
      buckets: []
    },
    options
  );
}

function createPainter() {
  return { style: {} };
}
