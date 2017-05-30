'use strict';

const test = require('mapbox-gl-js-test').test;
const VectorTileSource = require('../../../src/source/vector_tile_source');
const TileCoord = require('../../../src/source/tile_coord');
const window = require('../../../src/util/window');
const Evented = require('../../../src/util/evented');

function createSource(options) {
    const source = new VectorTileSource('id', options, {
        send: function() {},
        broadcast: function() {}
    }, options.eventedParent);
    source.onAdd({
        transform: { angle: 0, pitch: 0, cameraToCenterDistance: 1, cameraToTileDistance: () => { return 1; }, showCollisionBoxes: false }
    });

    source.on('error', (e) => {
        throw e.error;
    });


    return source;
}

test('VectorTileSource', (t) => {
    t.beforeEach((callback) => {
        window.useFakeXMLHttpRequest();
        callback();
    });

    t.afterEach((callback) => {
        window.restore();
        callback();
    });

    t.test('before', (t) => {
        window.useFakeCache();
        t.end();
    });

    t.test('can be constructed from TileJSON', (t) => {
        const source = createSource({
            minzoom: 1,
            maxzoom: 10,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        });

        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                t.deepEqual(source.tiles, ["http://example.com/{z}/{x}/{y}.png"]);
                t.deepEqual(source.minzoom, 1);
                t.deepEqual(source.maxzoom, 10);
                t.deepEqual(source.attribution, "Mapbox");
                t.end();
            }
        });
    });

    t.test('can be constructed from a TileJSON URL', (t) => {
        window.server.respondWith('/source.json', JSON.stringify(require('../../fixtures/source')));

        const source = createSource({ url: "/source.json" });

        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                t.deepEqual(source.tiles, ["http://example.com/{z}/{x}/{y}.png"]);
                t.deepEqual(source.minzoom, 1);
                t.deepEqual(source.maxzoom, 10);
                t.deepEqual(source.attribution, "Mapbox");
                t.end();
            }
        });

        window.server.respond();
    });

    t.test('fires event with metadata property', (t) => {
        window.server.respondWith('/source.json', JSON.stringify(require('../../fixtures/source')));
        const source = createSource({ url: "/source.json" });
        source.on('data', (e)=>{
            if (e.sourceDataType === 'content') t.end();
        });
        window.server.respond();
    });

    t.test('fires "dataloading" event', (t) => {
        window.server.respondWith('/source.json', JSON.stringify(require('../../fixtures/source')));
        const evented = new Evented();
        let dataloadingFired = false;
        evented.on('dataloading', () => {
            dataloadingFired = true;
        });
        const source = createSource({ url: "/source.json", eventedParent: evented });
        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                if (!dataloadingFired) t.fail();
                t.end();
            }
        });
        window.server.respond();
    });

    t.test('serialize URL', (t) => {
        const source = createSource({
            url: "http://localhost:2900/source.json"
        });
        t.deepEqual(source.serialize(), {
            type: 'vector',
            url: "http://localhost:2900/source.json"
        });
        t.end();
    });

    t.test('serialize TileJSON', (t) => {
        const source = createSource({
            minzoom: 1,
            maxzoom: 10,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        });
        t.deepEqual(source.serialize(), {
            type: 'vector',
            minzoom: 1,
            maxzoom: 10,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        });
        t.end();
    });

    function testScheme(scheme, expectedURL) {
        t.test(`scheme "${scheme}"`, (t) => {
            const source = createSource({
                minzoom: 1,
                maxzoom: 10,
                attribution: "Mapbox",
                tiles: ["http://example.com/{z}/{x}/{y}.png"],
                scheme: scheme
            });

            source.dispatcher.send = function(type, params) {
                t.equal(type, 'loadTile');
                t.equal(expectedURL, params.url);
                t.end();
            };

            source.on('data', (e) => {
                if (e.sourceDataType === 'metadata') source.loadTile({coord: new TileCoord(10, 5, 5, 0)}, () => {});
            });
        });
    }

    testScheme('xyz', 'http://example.com/10/5/5.png');
    testScheme('tms', 'http://example.com/10/5/1018.png');

    t.test('reloads a loading tile properly', (t) => {
        const source = createSource({
            tiles: ["http://example.com/{z}/{x}/{y}.png"]
        });
        const events = [];
        source.dispatcher.send = function(type, params, cb) {
            events.push(type);
            setTimeout(cb, 0);
            return 1;
        };

        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                const tile = {
                    coord: new TileCoord(10, 5, 5, 0),
                    state: 'loading',
                    loadVectorData: function () {
                        this.state = 'loaded';
                        events.push('tileLoaded');
                    },
                    setExpiryData: function() {}
                };
                source.loadTile(tile, () => {});
                t.equal(tile.state, 'loading');
                source.loadTile(tile, () => {
                    t.same(events, ['loadTile', 'tileLoaded', 'reloadTile', 'tileLoaded']);
                    t.end();
                });
            }
        });
    });

    t.test('respects TileJSON.bounds', (t)=>{
        const source = createSource({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"],
        });
        source.setBounds([-47, -7, -45, -5]);
        t.false(source.hasTile({z: 8, x:96, y: 132}), 'returns false for tiles outside bounds');
        t.true(source.hasTile({z: 8, x:95, y: 132}), 'returns true for tiles inside bounds');
        t.end();
    });

    t.test('does not error on invalid bounds', (t)=>{
        const source = createSource({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"],
        });
        source.setBounds([-47, -7, -45, 91]);
        t.deepEqual(source.tileBounds.bounds, {_sw:{lng: -47, lat: -7}, _ne:{lng: -45, lat: 90}}, 'converts invalid bounds to closest valid bounds');
        t.end();
    });

    t.test('respects TileJSON.bounds when loaded from TileJSON', (t)=>{
        window.server.respondWith('/source.json', JSON.stringify({
            minzoom: 0,
            maxzoom: 22,
            attribution: "Mapbox",
            tiles: ["http://example.com/{z}/{x}/{y}.png"],
            bounds: [-47, -7, -45, -5]
        }));
        const source = createSource({ url: "/source.json" });

        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                t.false(source.hasTile({z: 8, x:96, y: 132}), 'returns false for tiles outside bounds');
                t.true(source.hasTile({z: 8, x:95, y: 132}), 'returns true for tiles inside bounds');
                t.end();
            }
        });
        window.server.respond();
    });

    t.test('after', (t) => {
        window.restoreFakeCache();
        t.end();
    });

    t.end();
});
