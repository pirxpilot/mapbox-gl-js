'use strict';

const { test } = require('mapbox-gl-js-test');
const { register, serialize, deserialize } = require('../../../src/util/web_worker_transfer');

test('round trip', async t => {
  class Foo {
    constructor(n) {
      this.n = n;
      this.buffer = new ArrayBuffer(100);
      this.squared();
    }

    squared() {
      if (this._cached) {
        return this._cached;
      }
      this._cached = this.n * this.n;
      return this._cached;
    }
  }

  register('Foo', Foo, { omit: ['_cached'] });

  const foo = new Foo(10);
  const transferables = [];
  const deserialized = deserialize(serialize(foo, transferables));
  t.assert.ok(deserialized instanceof Foo);
  const bar = deserialized;

  t.assert.ok(foo !== bar);
  t.assert.ok(bar.constructor === Foo);
  t.assert.ok(bar.n === 10);
  t.assert.ok(bar.buffer === foo.buffer);
  t.assert.ok(transferables[0] === foo.buffer);
  t.assert.ok(bar._cached === undefined);
  t.assert.ok(bar.squared() === 100);
  t.end();
});

test('anonymous class', async t => {
  const Klass = (() => class {})();
  t.assert.ok(!Klass.name);
  register('Anon', Klass);
  const x = new Klass();
  const deserialized = deserialize(serialize(x));
  t.assert.ok(deserialized instanceof Klass);
  t.end();
});

test('custom serialization', async t => {
  class Bar {
    constructor(id) {
      this.id = id;
      this._deserialized = false;
    }

    static serialize(b) {
      return { foo: `custom serialization,${b.id}` };
    }

    static deserialize(input) {
      const b = new Bar(input.foo.split(',')[1]);
      b._deserialized = true;
      return b;
    }
  }

  register('Bar', Bar);

  const bar = new Bar('a');
  t.assert.ok(!bar._deserialized);

  const deserialized = deserialize(serialize(bar));
  t.assert.ok(deserialized instanceof Bar);
  const bar2 = deserialized;
  t.equal(bar2.id, bar.id);
  t.assert.ok(bar2._deserialized);
  t.end();
});
