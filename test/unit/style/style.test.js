const { test } = require('mapbox-gl-js-test');
const assert = require('assert');
const Style = require('../../../src/style/style');
const config = require('../../../src/util/config');
const SourceCache = require('../../../src/source/source_cache');
const StyleLayer = require('../../../src/style/style_layer');
const Transform = require('../../../src/geo/transform');
const EvaluationParameters = require('../../../src/style/evaluation_parameters');
const { Event, Evented } = require('../../../src/util/evented');
const window = require('../../../src/util/window');
const {
    setRTLTextPlugin,
    clearRTLTextPlugin,
    evented: rtlTextPluginEvented
} = require('../../../src/source/rtl_text_plugin');
const browser = require('../../../src/util/browser');
const { OverscaledTileID } = require('../../../src/source/tile_id');

function createStyleJSON(properties) {
    return Object.assign({
        "version": 8,
        "sources": {},
        "layers": []
    }, properties);
}

function createSource() {
    return {
        type: 'vector',
        minzoom: 1,
        maxzoom: 10,
        attribution: 'Mapbox',
        tiles: ['http://example.com/{z}/{x}/{y}.png']
    };
}

function createGeoJSONSource() {
    return {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    };
}

class StubMap extends Evented {
    constructor() {
        super();
        this.transform = new Transform();
    }
}

test('Style', async (t) => {
    t.afterEach(() => {
        window.restore();
    });

    await t.test('registers plugin listener', (t) => {
        clearRTLTextPlugin();

        t.spy(Style, 'registerForPluginAvailability');

        const style = new Style(new StubMap());
        t.spy(style.dispatcher, 'broadcast');
        t.ok(Style.registerForPluginAvailability.calledOnce);

        setRTLTextPlugin("some bogus url");
        t.ok(style.dispatcher.broadcast.calledWith('loadRTLTextPlugin', "some bogus url"));
    });

    await t.test('loads plugin immediately if already registered', (t, done) => {
        clearRTLTextPlugin();
        window.useFakeXMLHttpRequest();
        window.server.respondWith('/plugin.js', "doesn't matter");
        let firstError = true;
        setRTLTextPlugin("/plugin.js", (error) => {
            // Getting this error message shows the bogus URL was succesfully passed to the worker
            // We'll get the error from all workers, only pay attention to the first one
            if (firstError) {
                t.equal(error.message, 'RTL Text Plugin failed to import scripts from /plugin.js');
                done();
                firstError = false;
            }
        });
        window.server.respond();
        new Style(createStyleJSON());
    });
});

test('Style#loadJSON', async (t) => {
    t.afterEach(() => {
        window.restore();
    });

    await t.test('fires "dataloading" (synchronously)', (t) => {
        const style = new Style(new StubMap());
        const spy = t.spy();

        style.on('dataloading', spy);
        style.loadJSON(createStyleJSON());

        t.ok(spy.calledOnce);
        t.equal(spy.getCall(0).args[0].target, style);
        t.equal(spy.getCall(0).args[0].dataType, 'style');
    });

    await t.test('fires "data" (asynchronously)', (t, done) => {
        const style = new Style(new StubMap());

        style.loadJSON(createStyleJSON());

        style.on('data', (e) => {
            t.equal(e.target, style);
            t.equal(e.dataType, 'style');
            done();
        });
    });

    await t.test('fires "data" when the sprite finishes loading', { skip: true }, async (t) => {
        const img = {};

        t.before(() => {
            window.useFakeXMLHttpRequest();

            // Stubbing to bypass Web APIs that supported by jsdom:
            // * `URL.createObjectURL` in ajax.getImage (https://github.com/tmpvar/jsdom/issues/1721)
            // * `canvas.getContext('2d')` in browser.getImageData
            t.stub(window.URL, 'revokeObjectURL');
            t.stub(browser, 'getImageData');
            // stub Image so we can invoke 'onload'
            // https://github.com/jsdom/jsdom/commit/58a7028d0d5b6aacc5b435daee9fd8f9eacbb14c
            t.stub(window, 'Image').returns(img);
            // stub this manually because sinon does not stub non-existent methods
            assert(!window.URL.createObjectURL);
            window.URL.createObjectURL = () => 'blob:';
        });

        t.after(() => delete window.URL.createObjectURL);

        await t.test((t, done) => {

            // fake the image request (sinon doesn't allow non-string data for
            // server.respondWith, so we do so manually)
            const requests = [];
            window.XMLHttpRequest.onCreate = req => { requests.push(req); };
            const respond = () => {
                let req = requests.find(req => req.url === 'http://example.com/sprite.png');
                req.setStatus(200);
                req.response = new ArrayBuffer(8);
                req.onload();
                img.onload();

                req = requests.find(req => req.url === 'http://example.com/sprite.json');
                req.setStatus(200);
                req.response = '{}';
                req.onload();
            };

            const style = new Style(new StubMap());

            style.loadJSON({
                "version": 8,
                "sources": {},
                "layers": [],
                "sprite": "http://example.com/sprite"
            });

            style.once('error', (e) => t.ifError(e));

            style.once('data', (e) => {
                t.equal(e.target, style);
                t.equal(e.dataType, 'style');

                style.once('data', (e) => {
                    t.equal(e.target, style);
                    t.equal(e.dataType, 'style');
                    done();
                });

                respond();
            });
        });
    });

    await t.test('creates sources', (t, done) => {
        const style = new Style(new StubMap());

        style.on('style.load', () => {
            t.ok(style.sourceCaches['mapbox'] instanceof SourceCache);
            done();
        });

        style.loadJSON(Object.assign(createStyleJSON(), {
            "sources": {
                "mapbox": {
                    "type": "vector",
                    "tiles": []
                }
            }
        }));
    });

    await t.test('creates layers', (t, done) => {
        const style = new Style(new StubMap());

        style.on('style.load', () => {
            t.ok(style.getLayer('fill') instanceof StyleLayer);
            done();
        });

        style.loadJSON({
            "version": 8,
            "sources": {
                "foo": {
                    "type": "vector"
                }
            },
            "layers": [{
                "id": "fill",
                "source": "foo",
                "source-layer": "source-layer",
                "type": "fill"
            }]
        });
    });

    await t.test('emits an error on non-existant vector source layer', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            sources: {
                '-source-id-': { type: "vector", tiles: [] }
            },
            layers: []
        }));

        style.on('style.load', () => {
            style.removeSource('-source-id-');

            const source = createSource();
            source['vector_layers'] = [{ id: 'green' }];
            style.addSource('-source-id-', source);
            style.addLayer({
                'id': '-layer-id-',
                'type': 'circle',
                'source': '-source-id-',
                'source-layer': '-source-layer-'
            });
            style.update({});
        });

        style.on('error', (event) => {
            const err = event.error;
            t.ok(err);
            t.ok(err.toString().indexOf('-source-layer-') !== -1);
            t.ok(err.toString().indexOf('-source-id-') !== -1);
            t.ok(err.toString().indexOf('-layer-id-') !== -1);

            done();
        });
    });

    await t.test('sets up layer event forwarding', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'background',
                type: 'background'
            }]
        }));

        style.on('error', (e) => {
            t.deepEqual(e.layer, { id: 'background' });
            t.ok(e.mapbox);
            done();
        });

        style.on('style.load', () => {
            style._layers.background.fire(new Event('error', { mapbox: true }));
        });
    });
});

test('Style#_remove', async (t) => {
    await t.test('clears tiles', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            sources: { 'source-id': createGeoJSONSource() }
        }));

        style.on('style.load', () => {
            const sourceCache = style.sourceCaches['source-id'];
            t.spy(sourceCache, 'clearTiles');
            style._remove();
            t.ok(sourceCache.clearTiles.calledOnce);
            done();
        });
    });

    await t.test('deregisters plugin listener', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        t.spy(style.dispatcher, 'broadcast');

        style.on('style.load', () => {
            style._remove();

            rtlTextPluginEvented.fire(new Event('pluginAvailable'));
            t.notOk(style.dispatcher.broadcast.calledWith('loadRTLTextPlugin'));
            done();
        });
    });

});

test('Style#update', (t, done) => {
    const style = new Style(new StubMap());
    style.loadJSON({
        'version': 8,
        'sources': {
            'source': {
                'type': 'vector'
            }
        },
        'layers': [{
            'id': 'second',
            'source': 'source',
            'source-layer': 'source-layer',
            'type': 'fill'
        }]
    });

    style.on('error', (error) => { t.ifError(error); });

    style.on('style.load', () => {
        style.addLayer({ id: 'first', source: 'source', type: 'fill', 'source-layer': 'source-layer' }, 'second');
        style.addLayer({ id: 'third', source: 'source', type: 'fill', 'source-layer': 'source-layer' });
        style.removeLayer('second');

        style.dispatcher.broadcast = function (key, value) {
            t.equal(key, 'updateLayers');
            t.deepEqual(value.layers.map((layer) => { return layer.id; }), ['first', 'third']);
            t.deepEqual(value.removedIds, ['second']);
            done();
        };

        style.update({});
    });
});

test('Style#addSource', async (t) => {
    await t.test('throw before loaded', (t) => {
        const style = new Style(new StubMap());
        t.throws(() => style.addSource('source-id', createSource()), /load/i);
    });

    await t.test('throw if missing source type', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());

        const source = createSource();
        delete source.type;

        style.on('style.load', () => {
            t.throws(() => style.addSource('source-id', source), /type/i);
            done();
        });
    });

    await t.test('fires "data" event', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const source = createSource();
        style.once('data', () => done());
        style.on('style.load', () => {
            style.addSource('source-id', source);
            style.update({});
        });
    });

    await t.test('throws on duplicates', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const source = createSource();
        style.on('style.load', () => {
            style.addSource('source-id', source);
            t.throws(() => {
                style.addSource('source-id', source);
            }, /There is already a source with this ID/);
            done();
        });
    });

    await t.test('sets up source event forwarding', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'background',
                type: 'background'
            }]
        }));
        const source = createSource();

        style.on('style.load', () => {
            // FIME: plan should work
            // t.plan(4);

            style.on('error', () => { t.ok(true); });
            style.on('data', (e) => {
                if (e.sourceDataType === 'metadata' && e.dataType === 'source') {
                    t.ok(true);
                } else if (e.sourceDataType === 'content' && e.dataType === 'source') {
                    t.ok(true);
                } else {
                    t.ok(true);
                }
            });

            style.addSource('source-id', source); // fires data twice
            style.sourceCaches['source-id'].fire(new Event('error'));
            style.sourceCaches['source-id'].fire(new Event('data'));
            done();
        });
    });

});

test('Style#removeSource', async (t) => {
    await t.test('throw before loaded', (t) => {
        const style = new Style(new StubMap());
        t.throws(() => style.removeSource('source-id'), /load/i);
    });

    await t.test('fires "data" event', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const source = createSource();
        style.once('data', () => done());
        style.on('style.load', () => {
            style.addSource('source-id', source);
            style.removeSource('source-id');
            style.update({});
        });
    });

    await t.test('clears tiles', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            sources: { 'source-id': createGeoJSONSource() }
        }));

        style.on('style.load', () => {
            const sourceCache = style.sourceCaches['source-id'];
            t.spy(sourceCache, 'clearTiles');
            style.removeSource('source-id');
            t.ok(sourceCache.clearTiles.calledOnce);
            done();
        });
    });

    await t.test('throws on non-existence', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        style.on('style.load', () => {
            t.throws(() => {
                style.removeSource('source-id');
            }, /There is no source with this ID/);
            done();
        });
    });

    function createStyle(callback) {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            'sources': {
                'mapbox-source': createGeoJSONSource()
            },
            'layers': [{
                'id': 'mapbox-layer',
                'type': 'circle',
                'source': 'mapbox-source',
                'source-layer': 'whatever'
            }]
        }));
        style.on('style.load', () => {
            style.update(1, 0);
            callback(style);
        });
        return style;
    }

    await t.test('throws if source is in use', (t, done) => {
        createStyle((style) => {
            style.on('error', (event) => {
                t.ok(event.error.message.includes('"mapbox-source"'));
                t.ok(event.error.message.includes('"mapbox-layer"'));
                done();
            });
            style.removeSource('mapbox-source');
        });
    });

    await t.test('does not throw if source is not in use', (t, done) => {
        createStyle((style) => {
            style.on('error', () => {
                t.fail();
            });
            style.removeLayer('mapbox-layer');
            style.removeSource('mapbox-source');
            done();
        });
    });

    await t.test('tears down source event forwarding', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        let source = createSource();

        style.on('style.load', () => {
            style.addSource('source-id', source);
            source = style.sourceCaches['source-id'];

            style.removeSource('source-id');

            // Suppress error reporting
            source.on('error', () => { });

            style.on('data', () => { t.ok(false); });
            style.on('error', () => { t.ok(false); });
            source.fire(new Event('data'));
            source.fire(new Event('error'));

            done();
        });
    });

});

test('Style#setGeoJSONSourceData', async (t) => {
    const geoJSON = { type: "FeatureCollection", features: [] };

    await t.test('throws before loaded', (t, done) => {
        const style = new Style(new StubMap());
        t.throws(() => style.setGeoJSONSourceData('source-id', geoJSON), /load/i);
        done();
    });

    await t.test('throws on non-existence', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        style.on('style.load', () => {
            t.throws(() => style.setGeoJSONSourceData('source-id', geoJSON), /There is no source with this ID/);
            done();
        });
    });

});

test('Style#addLayer', async (t) => {
    await t.test('throw before loaded', (t) => {
        const style = new Style(new StubMap());
        t.throws(() => style.addLayer({ id: 'background', type: 'background' }), /load/i);
    });

    await t.test('sets up layer event forwarding', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());

        style.on('error', (e) => {
            t.deepEqual(e.layer, { id: 'background' });
            t.ok(e.mapbox);
            done();
        });

        style.on('style.load', () => {
            style.addLayer({
                id: 'background',
                type: 'background'
            });
            style._layers.background.fire(new Event('error', { mapbox: true }));
        });
    });

    await t.test('throws on non-existant vector source layer', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            sources: {
                // At least one source must be added to trigger the load event
                dummy: { type: "vector", tiles: [] }
            }
        }));

        style.on('style.load', () => {
            const source = createSource();
            source['vector_layers'] = [{ id: 'green' }];
            style.addSource('-source-id-', source);
            style.addLayer({
                'id': '-layer-id-',
                'type': 'circle',
                'source': '-source-id-',
                'source-layer': '-source-layer-'
            });
        });

        style.on('error', (event) => {
            const err = event.error;

            t.ok(err);
            t.ok(err.toString().indexOf('-source-layer-') !== -1);
            t.ok(err.toString().indexOf('-source-id-') !== -1);
            t.ok(err.toString().indexOf('-layer-id-') !== -1);

            done();
        });
    });

    await t.test('reloads source', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(Object.assign(createStyleJSON(), {
            "sources": {
                "mapbox": {
                    "type": "vector",
                    "tiles": []
                }
            }
        }));
        const layer = {
            "id": "symbol",
            "type": "symbol",
            "source": "mapbox",
            "source-layer": "boxmap",
            "filter": ["==", "id", 0]
        };

        style.on('data', (e) => {
            if (e.dataType === 'source' && e.sourceDataType === 'content') {
                style.sourceCaches['mapbox'].reload = done;
                style.addLayer(layer);
                style.update({});
            }
        });
    });

    await t.test('#3895 reloads source (instead of clearing) if adding this layer with the same type, immediately after removing it', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(Object.assign(createStyleJSON(), {
            "sources": {
                "mapbox": {
                    "type": "vector",
                    "tiles": []
                }
            },
            layers: [{
                "id": "my-layer",
                "type": "symbol",
                "source": "mapbox",
                "source-layer": "boxmap",
                "filter": ["==", "id", 0]
            }]
        }));

        const layer = {
            "id": "my-layer",
            "type": "symbol",
            "source": "mapbox",
            "source-layer": "boxmap"
        };

        style.on('data', (e) => {
            if (e.dataType === 'source' && e.sourceDataType === 'content') {
                style.sourceCaches['mapbox'].reload = done;
                style.sourceCaches['mapbox'].clearTiles = t.fail;
                style.removeLayer('my-layer');
                style.addLayer(layer);
                style.update({});
            }
        });

    });

    await t.test('clears source (instead of reloading) if adding this layer with a different type, immediately after removing it', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(Object.assign(createStyleJSON(), {
            "sources": {
                "mapbox": {
                    "type": "vector",
                    "tiles": []
                }
            },
            layers: [{
                "id": "my-layer",
                "type": "symbol",
                "source": "mapbox",
                "source-layer": "boxmap",
                "filter": ["==", "id", 0]
            }]
        }));

        const layer = {
            "id": "my-layer",
            "type": "circle",
            "source": "mapbox",
            "source-layer": "boxmap"
        };
        style.on('data', (e) => {
            if (e.dataType === 'source' && e.sourceDataType === 'content') {
                style.sourceCaches['mapbox'].reload = t.fail;
                style.sourceCaches['mapbox'].clearTiles = done;
                style.removeLayer('my-layer');
                style.addLayer(layer);
                style.update({});
            }
        });

    });

    await t.test('fires "data" event', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const layer = { id: 'background', type: 'background' };

        style.once('data', () => done());

        style.on('style.load', () => {
            style.addLayer(layer);
            style.update({});
        });
    });

    await t.test('emits error on duplicates', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const layer = { id: 'background', type: 'background' };

        style.on('error', (e) => {
            t.match(e.error.message, /already exists/);
            done();
        });

        style.on('style.load', () => {
            style.addLayer(layer);
            style.addLayer(layer);
        });
    });

    await t.test('adds to the end by default', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'a',
                type: 'background'
            }, {
                id: 'b',
                type: 'background'
            }]
        }));
        const layer = { id: 'c', type: 'background' };

        style.on('style.load', () => {
            style.addLayer(layer);
            t.deepEqual(style._order, ['a', 'b', 'c']);
            done();
        });
    });

    await t.test('adds before the given layer', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'a',
                type: 'background'
            }, {
                id: 'b',
                type: 'background'
            }]
        }));
        const layer = { id: 'c', type: 'background' };

        style.on('style.load', () => {
            style.addLayer(layer, 'a');
            t.deepEqual(style._order, ['c', 'a', 'b']);
            done();
        });
    });

    await t.test('fire error if before layer does not exist', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'a',
                type: 'background'
            }, {
                id: 'b',
                type: 'background'
            }]
        }));
        const layer = { id: 'c', type: 'background' };

        style.on('style.load', () => {
            style.on('error', (error) => {
                t.match(error.error.message, /does not exist on this map/);
                done();
            });
            style.addLayer(layer, 'z');
        });
    });

    await t.test('fires an error on non-existant source layer', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(Object.assign(createStyleJSON(), {
            sources: {
                dummy: {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                }
            }
        }));

        const layer = {
            id: 'dummy',
            type: 'fill',
            source: 'dummy',
            'source-layer': 'dummy'
        };

        style.on('style.load', () => {
            style.on('error', ({ error }) => {
                t.match(error.message, /does not exist on source/);
                done();
            });
            style.addLayer(layer);
        });

    });

});

test('Style#removeLayer', async (t) => {
    await t.test('throw before loaded', (t) => {
        const style = new Style(new StubMap());
        t.throws(() => style.removeLayer('background'), /load/i);
    });

    await t.test('fires "data" event', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const layer = { id: 'background', type: 'background' };

        style.once('data', () => done());

        style.on('style.load', () => {
            style.addLayer(layer);
            style.removeLayer('background');
            style.update({});
        });
    });

    await t.test('tears down layer event forwarding', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'background',
                type: 'background'
            }]
        }));

        style.on('error', () => {
            t.fail();
        });

        style.on('style.load', () => {
            const layer = style._layers.background;
            style.removeLayer('background');

            // Bind a listener to prevent fallback Evented error reporting.
            layer.on('error', () => { });

            layer.fire(new Event('error', { mapbox: true }));
            done();
        });
    });

    await t.test('fires an error on non-existence', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());

        style.on('style.load', () => {
            style.on('error', ({ error }) => {
                t.match(error.message, /does not exist in the map\'s style and cannot be removed/);
                done();
            });
            style.removeLayer('background');
        });
    });

    await t.test('removes from the order', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'a',
                type: 'background'
            }, {
                id: 'b',
                type: 'background'
            }]
        }));

        style.on('style.load', () => {
            style.removeLayer('a');
            t.deepEqual(style._order, ['b']);
            done();
        });
    });

    await t.test('does not remove dereffed layers', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [{
                id: 'a',
                type: 'background'
            }, {
                id: 'b',
                ref: 'a'
            }]
        }));

        style.on('style.load', () => {
            style.removeLayer('a');
            t.equal(style.getLayer('a'), undefined);
            t.notEqual(style.getLayer('b'), undefined);
            done();
        });
    });

});

test('Style#moveLayer', async (t) => {
    await t.test('throw before loaded', (t, done) => {
        const style = new Style(new StubMap());
        t.throws(() => style.moveLayer('background'), /load/i);
        done();
    });

    await t.test('fires "data" event', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());
        const layer = { id: 'background', type: 'background' };

        style.once('data', () => done());

        style.on('style.load', () => {
            style.addLayer(layer);
            style.moveLayer('background');
            style.update({});
        });
    });

    await t.test('fires an error on non-existence', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON());

        style.on('style.load', () => {
            style.on('error', ({ error }) => {
                t.match(error.message, /does not exist in the map\'s style and cannot be moved/);
                done();
            });
            style.moveLayer('background');
        });
    });

    await t.test('changes the order', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [
                { id: 'a', type: 'background' },
                { id: 'b', type: 'background' },
                { id: 'c', type: 'background' }
            ]
        }));

        style.on('style.load', () => {
            style.moveLayer('a', 'c');
            t.deepEqual(style._order, ['b', 'a', 'c']);
            done();
        });
    });

    await t.test('moves to existing location', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(createStyleJSON({
            layers: [
                { id: 'a', type: 'background' },
                { id: 'b', type: 'background' },
                { id: 'c', type: 'background' }
            ]
        }));

        style.on('style.load', () => {
            style.moveLayer('b', 'b');
            t.deepEqual(style._order, ['a', 'b', 'c']);
            done();
        });
    });

});

test('Style#setPaintProperty', async (t) => {
    await t.test('#4738 postpones source reload until layers have been broadcast to workers', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON(Object.assign(createStyleJSON(), {
            "sources": {
                "geojson": {
                    "type": "geojson",
                    "data": { "type": "FeatureCollection", "features": [] }
                }
            },
            "layers": [
                {
                    "id": "circle",
                    "type": "circle",
                    "source": "geojson"
                }
            ]
        }));

        const tr = new Transform();
        tr.resize(512, 512);

        style.once('style.load', () => {
            style.update(tr.zoom, 0);
            const sourceCache = style.sourceCaches['geojson'];
            const source = style.getSource('geojson');

            let begun = false;
            let styleUpdateCalled = false;

            source.on('data', (e) => setImmediate(() => {
                if (!begun && sourceCache.loaded()) {
                    begun = true;
                    t.stub(sourceCache, 'reload').callsFake(() => {
                        t.ok(styleUpdateCalled, 'loadTile called before layer data broadcast');
                        done();
                    });

                    source.setData({ "type": "FeatureCollection", "features": [] });
                    style.setPaintProperty('circle', 'circle-color', { type: 'identity', property: 'foo' });
                }

                if (begun && e.sourceDataType === 'content') {
                    // setData() worker-side work is complete; simulate an
                    // animation frame a few ms later, so that this test can
                    // confirm that SourceCache#reload() isn't called until
                    // after the next Style#update()
                    setTimeout(() => {
                        styleUpdateCalled = true;
                        style.update({});
                    }, 50);
                }
            }));
        });
    });

    await t.test('#5802 clones the input', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {},
            "layers": [
                {
                    "id": "background",
                    "type": "background"
                }
            ]
        });

        style.on('style.load', () => {
            const value = { stops: [[0, 'red'], [10, 'blue']] };
            style.setPaintProperty('background', 'background-color', value);
            t.notEqual(style.getPaintProperty('background', 'background-color'), value);
            t.ok(style._changed);

            style.update({});
            t.notOk(style._changed);

            value.stops[0][0] = 1;
            style.setPaintProperty('background', 'background-color', value);
            t.ok(style._changed);

            done();
        });
    });

});

test('Style#getPaintProperty', async (t) => {
    await t.test('#5802 clones the output', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {},
            "layers": [
                {
                    "id": "background",
                    "type": "background"
                }
            ]
        });

        style.on('style.load', () => {
            style.setPaintProperty('background', 'background-color', { stops: [[0, 'red'], [10, 'blue']] });
            style.update({});
            t.notOk(style._changed);

            const value = style.getPaintProperty('background', 'background-color');
            value.stops[0][0] = 1;
            style.setPaintProperty('background', 'background-color', value);
            t.ok(style._changed);

            done();
        });
    });

});

test('Style#setLayoutProperty', async (t) => {
    await t.test('#5802 clones the input', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {
                "geojson": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                }
            },
            "layers": [
                {
                    "id": "line",
                    "type": "line",
                    "source": "geojson"
                }
            ]
        });

        style.on('style.load', () => {
            const value = { stops: [[0, 'butt'], [10, 'round']] };
            style.setLayoutProperty('line', 'line-cap', value);
            t.notEqual(style.getLayoutProperty('line', 'line-cap'), value);
            t.ok(style._changed);

            style.update({});
            t.notOk(style._changed);

            value.stops[0][0] = 1;
            style.setLayoutProperty('line', 'line-cap', value);
            t.ok(style._changed);

            done();
        });
    });

});

test('Style#getLayoutProperty', async (t) => {
    await t.test('#5802 clones the output', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {
                "geojson": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                }
            },
            "layers": [
                {
                    "id": "line",
                    "type": "line",
                    "source": "geojson"
                }
            ]
        });

        style.on('style.load', () => {
            style.setLayoutProperty('line', 'line-cap', { stops: [[0, 'butt'], [10, 'round']] });
            style.update({});
            t.notOk(style._changed);

            const value = style.getLayoutProperty('line', 'line-cap');
            value.stops[0][0] = 1;
            style.setLayoutProperty('line', 'line-cap', value);
            t.ok(style._changed);

            done();
        });
    });

});

test('Style#setFilter', async (t) => {
    await t.test('throws if style is not loaded', (t, done) => {
        const style = new Style(new StubMap());
        t.throws(() => style.setFilter('symbol', ['==', 'id', 1]), /load/i);
        done();
    });

    function createStyle() {
        const style = new Style(new StubMap());
        style.loadJSON({
            version: 8,
            sources: {
                geojson: createGeoJSONSource()
            },
            layers: [
                { id: 'symbol', type: 'symbol', source: 'geojson', filter: ['==', 'id', 0] }
            ]
        });
        return style;
    }

    await t.test('sets filter', (t, done) => {
        const style = createStyle();

        style.on('style.load', () => {
            style.dispatcher.broadcast = function (key, value) {
                t.equal(key, 'updateLayers');
                t.deepEqual(value.layers[0].id, 'symbol');
                t.deepEqual(value.layers[0].filter, ['==', 'id', 1]);
                done();
            };

            style.setFilter('symbol', ['==', 'id', 1]);
            t.deepEqual(style.getFilter('symbol'), ['==', 'id', 1]);
            style.update({}); // trigger dispatcher broadcast
        });
    });

    await t.test('gets a clone of the filter', (t, done) => {
        const style = createStyle();

        style.on('style.load', () => {
            const filter1 = ['==', 'id', 1];
            style.setFilter('symbol', filter1);
            const filter2 = style.getFilter('symbol');
            const filter3 = style.getLayer('symbol').filter;

            t.notEqual(filter1, filter2);
            t.notEqual(filter1, filter3);
            t.notEqual(filter2, filter3);

            done();
        });
    });

    await t.test('sets again mutated filter', (t, done) => {
        const style = createStyle();

        style.on('style.load', () => {
            const filter = ['==', 'id', 1];
            style.setFilter('symbol', filter);
            style.update({}); // flush pending operations

            style.dispatcher.broadcast = function (key, value) {
                t.equal(key, 'updateLayers');
                t.deepEqual(value.layers[0].id, 'symbol');
                t.deepEqual(value.layers[0].filter, ['==', 'id', 2]);
                done();
            };
            filter[2] = 2;
            style.setFilter('symbol', filter);
            style.update({}); // trigger dispatcher broadcast
        });
    });

    await t.test('unsets filter', (t, done) => {
        const style = createStyle();
        style.on('style.load', () => {
            style.setFilter('symbol', null);
            t.equal(style.getLayer('symbol').serialize().filter, undefined);
            done();
        });
    });

    await t.test('fires an error if layer not found', (t, done) => {
        const style = createStyle();

        style.on('style.load', () => {
            style.on('error', ({ error }) => {
                t.match(error.message, /does not exist in the map\'s style and cannot be filtered/);
                done();
            });
            style.setFilter('non-existant', ['==', 'id', 1]);
        });
    });

});

test('Style#setLayerZoomRange', async (t) => {
    await t.test('throw before loaded', (t, done) => {
        const style = new Style(new StubMap());
        t.throws(() => style.setLayerZoomRange('symbol', 5, 12), /load/i);
        done();
    });

    function createStyle() {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {
                "geojson": createGeoJSONSource()
            },
            "layers": [{
                "id": "symbol",
                "type": "symbol",
                "source": "geojson"
            }]
        });
        return style;
    }

    await t.test('sets zoom range', (t, done) => {
        const style = createStyle();

        style.on('style.load', () => {
            style.dispatcher.broadcast = function (key, value) {
                t.equal(key, 'updateLayers');
                t.deepEqual(value.map((layer) => { return layer.id; }), ['symbol']);
            };

            style.setLayerZoomRange('symbol', 5, 12);
            t.equal(style.getLayer('symbol').minzoom, 5, 'set minzoom');
            t.equal(style.getLayer('symbol').maxzoom, 12, 'set maxzoom');
            done();
        });
    });

    await t.test('fires an error if layer not found', (t, done) => {
        const style = createStyle();
        style.on('style.load', () => {
            style.on('error', ({ error }) => {
                t.match(error.message, /does not exist in the map\'s style and cannot have zoom extent/);
                done();
            });
            style.setLayerZoomRange('non-existant', 5, 12);
        });
    });

});

test('Style#queryRenderedFeatures', (t, done) => {
    const style = new Style(new StubMap());
    const transform = new Transform();
    transform.resize(512, 512);

    function queryMapboxFeatures(layers, getFeatureState, queryGeom, scale, params) {
        const features = {
            'land': [{
                type: 'Feature',
                layer: style._layers.land.serialize(),
                geometry: {
                    type: 'Polygon'
                }
            }, {
                type: 'Feature',
                layer: style._layers.land.serialize(),
                geometry: {
                    type: 'Point'
                }
            }],
            'landref': [{
                type: 'Feature',
                layer: style._layers.landref.serialize(),
                geometry: {
                    type: 'Line'
                }
            }]
        };

        // format result to shape of tile.queryRenderedFeatures result
        for (const layer in features) {
            features[layer] = features[layer].map((feature, featureIndex) =>
                ({ feature, featureIndex }));
        }

        if (params.layers) {
            for (const l in features) {
                if (params.layers.indexOf(l) < 0) {
                    delete features[l];
                }
            }
        }

        return features;
    }

    style.loadJSON({
        "version": 8,
        "sources": {
            "mapbox": {
                "type": "geojson",
                "data": { type: "FeatureCollection", features: [] }
            },
            "other": {
                "type": "geojson",
                "data": { type: "FeatureCollection", features: [] }
            }
        },
        "layers": [{
            "id": "land",
            "type": "line",
            "source": "mapbox",
            "source-layer": "water",
            "layout": {
                'line-cap': 'round'
            },
            "paint": {
                "line-color": "red"
            },
            "metadata": {
                "something": "else"
            }
        }, {
            "id": "landref",
            "ref": "land",
            "paint": {
                "line-color": "blue"
            }
        }, {
            "id": "land--other",
            "type": "line",
            "source": "other",
            "source-layer": "water",
            "layout": {
                'line-cap': 'round'
            },
            "paint": {
                "line-color": "red"
            },
            "metadata": {
                "something": "else"
            }
        }]
    });

    style.on('style.load', async () => {
        style.sourceCaches.mapbox.tilesIn = () => {
            return [{
                tile: { queryRenderedFeatures: queryMapboxFeatures },
                tileID: new OverscaledTileID(0, 0, 0, 0, 0),
                queryGeometry: [],
                scale: 1
            }];
        };
        style.sourceCaches.other.tilesIn = () => {
            return [];
        };

        style.sourceCaches.mapbox.transform = transform;
        style.sourceCaches.other.transform = transform;

        style.update(new EvaluationParameters(0));
        style._updateSources(transform);

        await t.test('returns feature type', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], {}, transform);
            t.equal(results[0].geometry.type, 'Line');
            done();
        });

        await t.test('filters by `layers` option', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], { layers: ['land'] }, transform);
            t.equal(results.length, 2);
            done();
        });

        await t.test('checks type of `layers` option', (t, done) => {
            let errors = 0;
            t.stub(style, 'fire').callsFake((event) => {
                if (event.error && event.error.message.includes('parameters.layers must be an Array.')) errors++;
            });
            style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], { layers: 'string' }, transform);
            t.equal(errors, 1);
            done();
        });

        await t.test('includes layout properties', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], {}, transform);
            const layout = results[0].layer.layout;
            t.deepEqual(layout['line-cap'], 'round');
            done();
        });

        await t.test('includes paint properties', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], {}, transform);
            t.deepEqual(results[2].layer.paint['line-color'], 'red');
            done();
        });

        await t.test('includes metadata', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], {}, transform);

            const layer = results[1].layer;
            t.equal(layer.metadata.something, 'else');

            done();
        });

        await t.test('include multiple layers', (t, done) => {
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], { layers: ['land', 'landref'] }, transform);
            t.equal(results.length, 3);
            done();
        });

        await t.test('does not query sources not implicated by `layers` parameter', (t, done) => {
            style.sourceCaches.mapbox.queryRenderedFeatures = function () { t.fail(); };
            style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], { layers: ['land--other'] }, transform);
            done();
        });

        await t.test('ignores layer included in params if it does not exist on the style', (t, done) => {
            let errors = 0;
            t.stub(style, 'fire').callsFake((event) => {
                if (event.error && event.error.message.includes('does not exist in the map\'s style and cannot be queried for features.')) errors++;
            });
            const results = style.queryRenderedFeatures([{ column: 1, row: 1, zoom: 1 }], { layers: ['merp'] }, transform);
            t.equal(errors, 0);
            t.equal(results.length, 0);
            done();
        });

        done();
    });
});

test('Style defers expensive methods', (t, done) => {
    const style = new Style(new StubMap());
    style.loadJSON(createStyleJSON({
        "sources": {
            "streets": createGeoJSONSource(),
            "terrain": createGeoJSONSource()
        }
    }));

    style.on('style.load', () => {
        style.update({});

        // spies to track defered methods
        t.spy(style, 'fire');
        t.spy(style, '_reloadSource');
        t.spy(style, '_updateWorkerLayers');

        style.addLayer({ id: 'first', type: 'symbol', source: 'streets' });
        style.addLayer({ id: 'second', type: 'symbol', source: 'streets' });
        style.addLayer({ id: 'third', type: 'symbol', source: 'terrain' });

        style.setPaintProperty('first', 'text-color', 'black');
        style.setPaintProperty('first', 'text-halo-color', 'white');

        t.notOk(style.fire.called, 'fire is deferred');
        t.notOk(style._reloadSource.called, '_reloadSource is deferred');
        t.notOk(style._updateWorkerLayers.called, '_updateWorkerLayers is deferred');

        style.update({});

        t.equal(style.fire.args[0][0].type, 'data', 'a data event was fired');

        // called per source
        t.ok(style._reloadSource.calledTwice, '_reloadSource is called per source');
        t.ok(style._reloadSource.calledWith('streets'), '_reloadSource is called for streets');
        t.ok(style._reloadSource.calledWith('terrain'), '_reloadSource is called for terrain');

        // called once
        t.ok(style._updateWorkerLayers.calledOnce, '_updateWorkerLayers is called once');

        done();
    });
});

test('Style#addSourceType', async (t) => {
    const _types = { 'existing': function () { } };

    t.stub(Style, 'getSourceType').callsFake(name => _types[name]);
    t.stub(Style, 'setSourceType').callsFake((name, create) => {
        _types[name] = create;
    });

    await t.test('adds factory function', (t, done) => {
        const style = new Style(new StubMap());
        const SourceType = function () { };

        // expect no call to load worker source
        style.dispatcher.broadcast = function (type) {
            if (type === 'loadWorkerSource') {
                t.fail();
            }
        };

        style.addSourceType('foo', SourceType, () => {
            t.equal(_types['foo'], SourceType);
            done();
        });
    });

    await t.test('triggers workers to load worker source code', (t, done) => {
        const style = new Style(new StubMap());
        const SourceType = function () { };
        SourceType.workerSourceURL = 'worker-source.js';

        style.dispatcher.broadcast = function (type, params) {
            if (type === 'loadWorkerSource') {
                t.equal(_types['bar'], SourceType);
                t.equal(params.name, 'bar');
                t.equal(params.url, 'worker-source.js');
                done();
            }
        };

        style.addSourceType('bar', SourceType, (err) => { t.ifError(err); });
    });

    await t.test('refuses to add new type over existing name', (t, done) => {
        const style = new Style(new StubMap());
        style.addSourceType('existing', () => { }, (err) => {
            t.ok(err);
            done();
        });
    });

});

test('Style#hasTransitions', async (t) => {
    await t.test('returns false when the style is loading', (t, done) => {
        const style = new Style(new StubMap());
        t.equal(style.hasTransitions(), false);
        done();
    });

    await t.test('returns true when a property is transitioning', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {},
            "layers": [{
                "id": "background",
                "type": "background"
            }]
        });

        style.on('style.load', () => {
            style.setPaintProperty("background", "background-color", "blue");
            style.update({ transition: { duration: 300, delay: 0 } });
            t.equal(style.hasTransitions(), true);
            done();
        });
    });

    await t.test('returns false when a property is not transitioning', (t, done) => {
        const style = new Style(new StubMap());
        style.loadJSON({
            "version": 8,
            "sources": {},
            "layers": [{
                "id": "background",
                "type": "background"
            }]
        });

        style.on('style.load', () => {
            style.setPaintProperty("background", "background-color", "blue");
            style.update({ transition: { duration: 0, delay: 0 } });
            t.equal(style.hasTransitions(), false);
            done();
        });
    });

});
