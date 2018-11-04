const { test } = require('mapbox-gl-js-test');
const config = require('../../../src/util/config');
const RasterDEMTileSource = require('../../../src/source/raster_dem_tile_source');
const window = require('../../../src/util/window');
const { OverscaledTileID } = require('../../../src/source/tile_id');

function createSource(options) {
    const source = new RasterDEMTileSource('id', options, { send: function() {} }, options.eventedParent);
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

    t.test('populates neighboringTiles', (t) => {
        window.server.respondWith('http://example.com/source.json', JSON.stringify({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        }));
        const source = createSource({ url: "/source.json" });
        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                const tile = {
                    tileID: new OverscaledTileID(10, 0, 10, 5, 5),
                    state: 'loading',
                    loadVectorData: function () {},
                    setExpiryData: function() {}
                };
                source.loadTile(tile, () => {});

                t.deepEqual(Object.keys(tile.neighboringTiles), [
                    new OverscaledTileID(10, 0, 10, 4, 4).key,
                    new OverscaledTileID(10, 0, 10, 5, 4).key,
                    new OverscaledTileID(10, 0, 10, 6, 4).key,
                    new OverscaledTileID(10, 0, 10, 4, 5).key,
                    new OverscaledTileID(10, 0, 10, 6, 5).key,
                    new OverscaledTileID(10, 0, 10, 4, 6).key,
                    new OverscaledTileID(10, 0, 10, 5, 6).key,
                    new OverscaledTileID(10, 0, 10, 6, 6).key
                ]);

                t.end();

            }
        });
        window.server.respond();
    });

    t.test('populates neighboringTiles with wrapped tiles', (t) => {
        window.server.respondWith('http://example.com/source.json', JSON.stringify({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        }));
        const source = createSource({ url: "/source.json" });
        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                const tile = {
                    tileID: new OverscaledTileID(5, 0, 5, 31, 5),
                    state: 'loading',
                    loadVectorData: function () {},
                    setExpiryData: function() {}
                };
                source.loadTile(tile, () => {});

                t.deepEqual(Object.keys(tile.neighboringTiles), [
                    new OverscaledTileID(5, 0, 5, 30, 4).key,
                    new OverscaledTileID(5, 0, 5, 31, 4).key,
                    new OverscaledTileID(5, 0, 5, 30, 5).key,
                    new OverscaledTileID(5, 0, 5, 30, 6).key,
                    new OverscaledTileID(5, 0, 5, 31, 6).key,
                    new OverscaledTileID(5, 1, 5, 0,  4).key,
                    new OverscaledTileID(5, 1, 5, 0,  5).key,
                    new OverscaledTileID(5, 1, 5, 0,  6).key
                ]);
                t.end();
            }
        });
        window.server.respond();
    });
    t.end();

});
