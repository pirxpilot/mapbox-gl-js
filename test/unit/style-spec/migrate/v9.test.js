const { test } = require('../../../util/mapbox-gl-js-test');
const migrate = require('../../../../src/style-spec/migrate/v9');

test('deref layers', t => {
  const input = {
    version: 8,
    sources: {
      a: { type: 'vector', tiles: ['http://dev/null'] }
    },
    layers: [
      {
        id: 'parent',
        source: 'a',
        'source-layer': 'x',
        type: 'fill'
      },
      {
        id: 'child',
        ref: 'parent'
      }
    ]
  };

  t.assert.deepEqual(migrate(input), {
    version: 9,
    sources: {
      a: { type: 'vector', tiles: ['http://dev/null'] }
    },
    layers: [
      {
        id: 'parent',
        source: 'a',
        'source-layer': 'x',
        type: 'fill'
      },
      {
        id: 'child',
        source: 'a',
        'source-layer': 'x',
        type: 'fill'
      }
    ]
  });
});

test('declass style', t => {
  const input = {
    version: 8,
    sources: {
      a: { type: 'vector', tiles: ['http://dev/null'] }
    },
    layers: [
      {
        id: 'a',
        source: 'a',
        type: 'fill',
        paint: {},
        'paint.right': {
          'fill-color': 'red'
        },
        'paint.left': {
          'fill-color': 'blue'
        }
      }
    ]
  };

  t.assert.deepEqual(migrate(input), {
    version: 9,
    sources: {
      a: { type: 'vector', tiles: ['http://dev/null'] }
    },
    layers: [
      {
        id: 'a',
        source: 'a',
        type: 'fill',
        paint: {}
      }
    ]
  });
});
