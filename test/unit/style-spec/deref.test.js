const { test: t } = require('mapbox-gl-js-test');
const deref = require('../../../src/style-spec/deref');

t('derefs a ref layer which follows its parent', async t => {
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
  t.end();
});

t('derefs a ref layer which precedes its parent', async t => {
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
  t.end();
});
