const { test } = require('../../util/mapbox-gl-js-test');
const deref = require('../../../src/style-spec/deref');

test('derefs a ref layer which follows its parent', t => {
  t.deepEqual(
    deref([
      {
        id: 'parent',
        type: 'line'
      },
      {
        id: 'child',
        ref: 'parent'
      }
    ]),
    [
      {
        id: 'parent',
        type: 'line'
      },
      {
        id: 'child',
        type: 'line'
      }
    ]
  );
});

test('derefs a ref layer which precedes its parent', t => {
  t.deepEqual(
    deref([
      {
        id: 'child',
        ref: 'parent'
      },
      {
        id: 'parent',
        type: 'line'
      }
    ]),
    [
      {
        id: 'child',
        type: 'line'
      },
      {
        id: 'parent',
        type: 'line'
      }
    ]
  );
});
