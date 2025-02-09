const { test } = require('mapbox-gl-js-test');
const assert = require('assert');
const ImageSource = require('../../../src/source/image_source');
const { Evented } = require('../../../src/util/evented');
const Transform = require('../../../src/geo/transform');
const browser = require('../../../src/util/browser');
const window = require('../../../src/util/window');

function createSource(options) {
    options = Object.assign({
        coordinates: [[0, 0], [1, 0], [1, 1], [0, 1]]
    }, options);

    const source = new ImageSource('id', options, { send: function () { } }, options.eventedParent);
    return source;
}

class StubMap extends Evented {
    constructor() {
        super();
        this.transform = new Transform();
    }
}

test('ImageSource', async (t) => {
    let respond;

    t.after(() => delete window.URL.createObjectURL);

    t.before(() => {
        window.useFakeXMLHttpRequest();
        // stub this manually because sinon does not stub non-existent methods
        assert(!window.URL.createObjectURL);
        window.URL.createObjectURL = () => 'blob:';
        // stub Image so we can invoke 'onload'
        // https://github.com/jsdom/jsdom/commit/58a7028d0d5b6aacc5b435daee9fd8f9eacbb14c
        const img = {};
        t.stub(window, 'Image').returns(img);
        // fake the image request (sinon doesn't allow non-string data for
        // server.respondWith, so we do so manually)
        const requests = [];
        window.XMLHttpRequest.onCreate = req => { requests.push(req); };
        respond = () => {
            const req = requests.shift();
            req.setStatus(200);
            req.response = new ArrayBuffer(1);
            req.onload();
            img.onload();
        };
        t.stub(browser, 'getImageData').callsFake(() => new ArrayBuffer(1));
    });

    await t.test('constructor', async (t) => {
        const source = createSource({ url: '/image.png' });

        t.equal(source.minzoom, 0);
        t.equal(source.maxzoom, 22);
        t.equal(source.tileSize, 512);
        t.end();
    });

    await t.test('fires dataloading event', async (t) => {
        const source = createSource({ url: '/image.png' });
        source.on('dataloading', (e) => {
            t.equal(e.dataType, 'source');
            t.end();
        });
        source.onAdd(new StubMap());
        respond();
    });

    await t.test('fires data event when content is loaded', async (t) => {
        const source = createSource({ url: '/image.png' });
        source.on('data', (e) => {
            if (e.dataType === 'source' && e.sourceDataType === 'content') {
                t.ok(typeof source.tileID == 'object');
                t.end();
            }
        });
        source.onAdd(new StubMap());
        respond();
    });

    await t.test('fires data event when metadata is loaded', async (t) => {
        const source = createSource({ url: '/image.png' });
        source.on('data', (e) => {
            if (e.dataType === 'source' && e.sourceDataType === 'metadata') {
                t.end();
            }
        });
        source.onAdd(new StubMap());
        respond();
    });

    await t.test('serialize url and coordinates', async (t) => {
        const source = createSource({ url: '/image.png' });

        const serialized = source.serialize();
        t.equal(serialized.type, 'image');
        t.equal(serialized.url, '/image.png');
        t.deepEqual(serialized.coordinates, [[0, 0], [1, 0], [1, 1], [0, 1]]);

        t.end();
    });
});
