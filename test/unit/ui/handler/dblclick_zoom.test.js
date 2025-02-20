const { test } = require('../../../util/mapbox-gl-js-test');
const _window = require('../../../util/window');
const Map = require('../../../../src/ui/map');
const DOM = require('../../../../src/util/dom');
const simulate = require('../../../util/mapbox-gl-js-test/simulate_interaction');

function createMap() {
  return new Map({ container: DOM.create('div', '', window.document.body) });
}

test('DoubleClickZoomHandler does not zoom if preventDefault is called on the dblclick event', t => {
  let globalWindow;
  t.before(() => {
    globalWindow = globalThis.window;
    globalThis.window = _window;
  });
  t.after(() => {
    globalThis.window = globalWindow;
  });

  const map = createMap();

  map.on('dblclick', e => e.preventDefault());

  const zoom = t.spy();
  map.on('zoom', zoom);

  simulate.dblclick(map.getCanvas());

  t.assert.equal(zoom.callCount, 0);

  map.remove();
});
