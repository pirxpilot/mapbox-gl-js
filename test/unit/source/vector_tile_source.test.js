const { test } = require('mapbox-gl-js-test');
const VectorTileSource = require('../../../src/source/vector_tile_source');
const config = require('../../../src/util/config');
const { OverscaledTileID } = require('../../../src/source/tile_id');
const window = require('../../../src/util/window');
const { Evented } = require('../../../src/util/evented');

function createSource(options) {
    const source = new VectorTileSource('id', options, {
        send: function() {},
        broadcast: function() {}
    }, options.eventedParent);
    source.onAdd({
        transform: { showCollisionBoxes: false }
    });

    source.on('error', (e) => {
        throw e.error;
    });


    return source;
}

test('VectorTileSource', async (t) => {
    let baseUrl;

    t.beforeEach(() => {
        baseUrl = config.BASE_URL;
        config.BASE_URL = 'http://example.com';
        window.useFakeXMLHttpRequest();
    });

    t.afterEach(() => {
        config.BASE_URL = baseUrl;
        window.restore();
    });

    await t.test('can be constructed from TileJSON', async (t) => {
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

    await t.test('fires event with metadata property', (t) => {
        const source = createSource(require('../../fixtures/source'));
        source.on('data', (e)=>{
            if (e.sourceDataType === 'content') t.end();
        });
        window.server.respond();
    });

    await t.test('fires "dataloading" event', (t) => {
        const evented = new Evented();
        let dataloadingFired = false;
        evented.on('dataloading', () => {
            dataloadingFired = true;
        });
        const source = createSource(Object.assign({ eventedParent: evented }, require('../../fixtures/source')));
        source.on('data', (e) => {
            if (e.sourceDataType === 'metadata') {
                if (!dataloadingFired) t.fail();
                t.end();
            }
        });
        window.server.respond();
    });

    await t.test('serialize TileJSON', (t) => {
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

    async function testScheme(scheme, expectedURL) {
        await t.test(`scheme "${scheme}"`, async (t) => {
            const source = createSource({
                minzoom: 1,
                maxzoom: 10,
                attribution: "Mapbox",
                tiles: ["http://example.com/{z}/{x}/{y}.png"],
                scheme: scheme
            });

            source.dispatcher.send = function(type, params) {
                t.equal(type, 'loadTile');
                t.equal(expectedURL, params.request.url);
                t.end();
            };

            source.on('data', (e) => {
                if (e.sourceDataType === 'metadata') source.loadTile({
                    tileID: new OverscaledTileID(10, 0, 10, 5, 5)
                }, () => {});
            });
        });
    }

    await testScheme('xyz', 'http://example.com/10/5/5.png');
    await testScheme('tms', 'http://example.com/10/5/1018.png');

    await t.test('reloads a loading tile properly', async (t) => {
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
                    tileID: new OverscaledTileID(10, 0, 10, 5, 5),
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

    await t.test('respects TileJSON.bounds', (t)=>{
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

    await t.test('does not error on invalid bounds', (t)=>{
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
