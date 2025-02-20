const { test } = require('../../util/mapbox-gl-js-test');
const composite = require('../../../src/style-spec/composite');

test('composites Mapbox vector sources', t => {
  const result = composite({
    version: 7,
    sources: {
      'mapbox-a': {
        type: 'vector',
        url: 'mapbox://a'
      },
      'mapbox-b': {
        type: 'vector',
        url: 'mapbox://b'
      }
    },
    layers: [
      {
        id: 'a',
        type: 'line',
        source: 'mapbox-a'
      },
      {
        id: 'b',
        type: 'line',
        source: 'mapbox-b'
      }
    ]
  });

  t.assert.deepEqual(result.sources, {
    'a,b': {
      type: 'vector',
      url: 'mapbox://a,b'
    }
  });

  t.assert.equal(result.layers[0].source, 'a,b');
  t.assert.equal(result.layers[1].source, 'a,b');
});

test('does not composite vector + raster', t => {
  const result = composite({
    version: 7,
    sources: {
      a: {
        type: 'vector',
        url: 'mapbox://a'
      },
      b: {
        type: 'raster',
        url: 'mapbox://b'
      }
    },
    layers: []
  });

  t.assert.deepEqual(Object.keys(result.sources), ['a', 'b']);
});

test('incorrect url match', t => {
  const result = composite({
    version: 7,
    sources: {
      a: {
        type: 'vector',
        url: 'mapbox://a'
      },
      b: {
        type: 'vector',
        url: ''
      }
    },
    layers: []
  });

  t.assert.deepEqual(Object.keys(result.sources), ['a', 'b']);
});

test('composites Mapbox vector sources with conflicting source layer names', t => {
  t.assert.throws(
    () => {
      composite({
        version: 7,
        sources: {
          'mapbox-a': {
            type: 'vector',
            url: 'mapbox://a'
          },
          'mapbox-b': {
            type: 'vector',
            url: 'mapbox://b'
          }
        },
        layers: [
          {
            id: 'a',
            type: 'line',
            'source-layer': 'sourcelayer',
            source: 'mapbox-a'
          },
          {
            id: 'b',
            type: 'line',
            'source-layer': 'sourcelayer',
            source: 'mapbox-b'
          }
        ]
      });
    },
    /Conflicting source layer names/,
    'throws error on conflicting source layer names'
  );
});
