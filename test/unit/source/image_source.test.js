const { test } = require('../../util/mapbox-gl-js-test');
const _window = require('../../util/window');
const ImageSource = require('../../../src/source/image_source');
const { Evented } = require('../../../src/util/evented');
const Transform = require('../../../src/geo/transform');
const browser = require('../../../src/util/browser');

function createSource(options) {
  options = Object.assign(
    {
      coordinates: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ]
    },
    options
  );

  const source = new ImageSource('id', options, { send: function () {} }, options.eventedParent);
  return source;
}

class StubMap extends Evented {
  constructor() {
    super();
    this.transform = new Transform();
  }
}

test('ImageSource', async t => {
  let globalWindow;
  let respond;
  t.before(() => {
    globalWindow = globalThis.window;
    globalThis.window = _window;

    t.stub(window.URL, 'createObjectURL').returns('blob:');
    // stub Image so we can invoke 'onload'
    // https://github.com/jsdom/jsdom/commit/58a7028d0d5b6aacc5b435daee9fd8f9eacbb14c
    const img = {};
    t.stub(window, 'Image').returns(img);
    respond = () => {
      img.onload();
    };
    t.stub(browser, 'getImageData').callsFake(() => new ArrayBuffer(1));
  });
  t.after(() => {
    globalThis.window = globalWindow;
  });

  await t.test('constructor', async t => {
    const source = createSource({ url: new ArrayBuffer(0) });

    t.equal(source.minzoom, 0);
    t.equal(source.maxzoom, 22);
    t.equal(source.tileSize, 512);
  });

  await t.test('fires dataloading event', async t => {
    const source = createSource({ url: new ArrayBuffer(0) });
    source.on('dataloading', e => {
      t.equal(e.dataType, 'source');
      t.end();
    });
    source.onAdd(new StubMap());
    respond();
  });

  await t.test('fires data event when content is loaded', async t => {
    const source = createSource({ url: new ArrayBuffer(0) });
    source.on('data', e => {
      if (e.dataType === 'source' && e.sourceDataType === 'content') {
        t.equal(typeof source.tileID, 'object');
        t.end();
      }
    });
    source.onAdd(new StubMap());
    respond();
  });

  await t.test('fires data event when metadata is loaded', async t => {
    const source = createSource({ url: new ArrayBuffer(0) });
    source.on('data', e => {
      if (e.dataType === 'source' && e.sourceDataType === 'metadata') {
        t.end();
      }
    });
    source.onAdd(new StubMap());
    respond();
  });

  await t.test('serialize url and coordinates', async t => {
    const url = new ArrayBuffer(0);
    const source = createSource({ url });

    const serialized = source.serialize();
    t.equal(serialized.type, 'image');
    t.equal(serialized.url, url);
    t.deepEqual(serialized.coordinates, [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ]);
  });
});
