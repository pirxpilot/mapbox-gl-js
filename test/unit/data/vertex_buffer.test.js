const { test } = require('../../util/mapbox-gl-js-test');
const VertexBuffer = require('../../../src/gl/vertex_buffer');
const { StructArrayLayout3i6 } = require('../../../src/data/array_types');
const Context = require('../../../src/gl/context');

test('VertexBuffer', async t => {
  class TestArray extends StructArrayLayout3i6 {}
  const attributes = [
    { name: 'map', components: 1, type: 'Int16', offset: 0 },
    { name: 'box', components: 2, type: 'Int16', offset: 4 }
  ];

  await t.test('constructs itself', t => {
    const context = new Context(require('gl')(10, 10));
    const array = new TestArray();
    array.emplaceBack(1, 1, 1);
    array.emplaceBack(1, 1, 1);
    array.emplaceBack(1, 1, 1);

    const buffer = new VertexBuffer(context, array, attributes);

    t.assert.deepEqual(buffer.attributes, [
      { name: 'map', components: 1, type: 'Int16', offset: 0 },
      { name: 'box', components: 2, type: 'Int16', offset: 4 }
    ]);
    t.assert.deepEqual(buffer.itemSize, 6);
    t.assert.deepEqual(buffer.length, 3);
  });

  await t.test('enableAttributes', t => {
    const context = new Context(require('gl')(10, 10));
    const array = new TestArray();
    const buffer = new VertexBuffer(context, array, attributes);
    t.stub(context.gl, 'enableVertexAttribArray').callsFake(() => {});
    buffer.enableAttributes(context.gl, { attributes: { map: 5, box: 6 } });
    t.assert.deepEqual(context.gl.enableVertexAttribArray.args, [[5], [6]]);
  });

  await t.test('setVertexAttribPointers', t => {
    const context = new Context(require('gl')(10, 10));
    const array = new TestArray();
    const buffer = new VertexBuffer(context, array, attributes);
    t.stub(context.gl, 'vertexAttribPointer').callsFake(() => {});
    buffer.setVertexAttribPointers(context.gl, { attributes: { map: 5, box: 6 } }, 50);
    t.assert.deepEqual(context.gl.vertexAttribPointer.args, [
      [5, 1, context.gl['SHORT'], false, 6, 300],
      [6, 2, context.gl['SHORT'], false, 6, 304]
    ]);
  });
});
