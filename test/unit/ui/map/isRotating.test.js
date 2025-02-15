const { test } = require('../../../util/mapbox-gl-js-test');
const window = require('../../../../src/util/window');
const Map = require('../../../../src/ui/map');
const DOM = require('../../../../src/util/dom');
const simulate = require('../../../util/mapbox-gl-js-test/simulate_interaction');

function createMap() {
  return new Map({ container: DOM.create('div', '', window.document.body) });
}

test('Map#isRotating returns false by default', async t => {
  const map = createMap();
  t.equal(map.isRotating(), false);
  map.remove();
  t.end();
});

test('Map#isRotating returns true during a camera rotate animation', async t => {
  const map = createMap();

  map.on('rotatestart', () => {
    t.equal(map.isRotating(), true);
  });

  map.on('rotateend', () => {
    t.equal(map.isRotating(), false);
    map.remove();
    t.end();
  });

  map.rotateTo(5, { duration: 0 });
});

test('Map#isRotating returns true when drag rotating', async t => {
  const map = createMap();

  map.on('rotatestart', () => {
    t.equal(map.isRotating(), true);
  });

  map.on('rotateend', () => {
    t.equal(map.isRotating(), false);
    map.remove();
    t.end();
  });

  simulate.mousedown(map.getCanvas(), { buttons: 2, button: 2 });
  map._renderTaskQueue.run();

  simulate.mousemove(map.getCanvas(), { buttons: 2 });
  map._renderTaskQueue.run();

  simulate.mouseup(map.getCanvas(), { buttons: 0, button: 2 });
  map._renderTaskQueue.run();
});
