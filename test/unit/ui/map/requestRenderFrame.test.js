const { test } = require('../../../util/mapbox-gl-js-test');
const window = require('../../../../src/util/window');
const Map = require('../../../../src/ui/map');
const DOM = require('../../../../src/util/dom');

function createMap() {
  return new Map({
    container: DOM.create('div', '', window.document.body),
    style: {
      version: 8,
      sources: {},
      layers: []
    }
  });
}

test('Map#_requestRenderFrame schedules a new render frame if necessary', async t => {
  const map = createMap();
  t.stub(map, '_rerender');
  map._requestRenderFrame(() => {});
  t.equal(map._rerender.callCount, 1);
  map.remove();
  t.end();
});

test('Map#_requestRenderFrame queues a task for the next render frame', async t => {
  const map = createMap();
  const cb = t.spy();
  map._requestRenderFrame(cb);
  map.once('render', () => {
    t.equal(cb.callCount, 1);
    map.remove();
    t.end();
  });
});

test('Map#_cancelRenderFrame cancels a queued task', async t => {
  const map = createMap();
  const cb = t.spy();
  const id = map._requestRenderFrame(cb);
  map._cancelRenderFrame(id);
  map.once('render', () => {
    t.equal(cb.callCount, 0);
    map.remove();
    t.end();
  });
});
