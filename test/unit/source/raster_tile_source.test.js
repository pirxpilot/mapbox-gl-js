const { test } = require('mapbox-gl-js-test');
const config = require('../../../src/util/config');
const RasterTileSource = require('../../../src/source/raster_tile_source');
const window = require('../../../src/util/window');
const { OverscaledTileID } = require('../../../src/source/tile_id');

function createSource(options) {
    const source = new RasterTileSource('id', options, { send: function() {} }, options.eventedParent);
    source.onAdd({
        transform: { angle: 0, pitch: 0, showCollisionBoxes: false }
    });

    source.on('error', (e) => {
        throw e.error;
    });

    return source;
}

test('RasterTileSource', (t) => {
    let baseUrl;

    t.beforeEach((callback) => {
        baseUrl = config.BASE_URL;
        config.BASE_URL = 'http://example.com';
        window.useFakeXMLHttpRequest();
        callback();
    });

    t.afterEach((callback) => {
        config.BASE_URL = baseUrl;
        window.restore();
        callback();
    });

    t.test('respects TileJSON.bounds', (t)=>{
        const source = createSource({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"],
            bounds: [-47, -7, -45, -5]
        });
        source.on('data', (e)=>{
            if (e.sourceDataType === 'metadata') {
                t.false(source.hasTile(new OverscaledTileID(8, 0, 8, 96, 132)), 'returns false for tiles outside bounds');
                t.true(source.hasTile(new OverscaledTileID(8, 0, 8, 95, 132)), 'returns true for tiles inside bounds');
                t.end();
            }
        });
    });

    t.test('does not error on invalid bounds', (t)=>{
        const source = createSource({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"],
            bounds: [-47, -7, -45, 91]
        });

        source.on('data', (e)=>{
            if (e.sourceDataType === 'metadata') {
                t.deepEqual(source.tileBounds.bounds, {_sw:{lng: -47, lat: -7}, _ne:{lng: -45, lat: 90}}, 'converts invalid bounds to closest valid bounds');
                t.end();
            }
        });
    });

    t.end();
});
