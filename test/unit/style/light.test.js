const { test } = require('../../util/mapbox-gl-js-test');
const Light = require('../../../src/style/light');
const styleSpec = require('../../../src/style-spec/reference/latest');
const Color = require('../../../src/style-spec/util/color');
const { sphericalToCartesian } = require('../../../src/util/util');

const spec = styleSpec.light;

test('Light with defaults', async t => {
  const light = new Light({});
  light.recalculate({ zoom: 0, zoomHistory: {} });

  t.deepEqual(light.properties.get('anchor'), spec.anchor.default);
  t.deepEqual(light.properties.get('position'), sphericalToCartesian(spec.position.default));
  t.deepEqual(light.properties.get('intensity'), spec.intensity.default);
  t.deepEqual(light.properties.get('color'), Color.parse(spec.color.default));

  t.end();
});

test('Light with options', async t => {
  const light = new Light({
    anchor: 'map',
    position: [2, 30, 30],
    intensity: 1
  });
  light.recalculate({ zoom: 0, zoomHistory: {} });

  t.deepEqual(light.properties.get('anchor'), 'map');
  t.deepEqual(light.properties.get('position'), sphericalToCartesian([2, 30, 30]));
  t.deepEqual(light.properties.get('intensity'), 1);
  t.deepEqual(light.properties.get('color'), Color.parse(spec.color.default));

  t.end();
});

test('Light with stops function', async t => {
  const light = new Light({
    intensity: {
      stops: [
        [16, 0.2],
        [17, 0.8]
      ]
    }
  });
  light.recalculate({ zoom: 16.5, zoomHistory: {} });

  t.deepEqual(light.properties.get('intensity'), 0.5);

  t.end();
});

test('Light#getLight', async t => {
  const defaults = {};
  for (const key in spec) {
    defaults[key] = spec[key].default;
  }

  t.deepEqual(new Light(defaults).getLight(), defaults);
  t.end();
});

test('Light#setLight', async t => {
  const light = new Light({});
  light.setLight({ color: 'red', 'color-transition': { duration: 3000 } });
  light.updateTransitions({ transition: true }, {});
  light.recalculate({ zoom: 16, zoomHistory: {}, now: 1500 });

  t.deepEqual(light.properties.get('color'), new Color(1, 0.5, 0.5, 1));

  t.end();
});
