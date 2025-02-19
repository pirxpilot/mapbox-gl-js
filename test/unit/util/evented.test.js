const { test } = require('../../util/mapbox-gl-js-test');
const { Event, Evented } = require('../../../src/util/evented');

test('Evented', async t => {
  await t.test('calls listeners added with "on"', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.on('a', listener);
    evented.fire(new Event('a'));
    evented.fire(new Event('a'));
    t.ok(listener.calledTwice);
  });

  await t.test('calls listeners added with "once" once', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.once('a', listener);
    evented.fire(new Event('a'));
    evented.fire(new Event('a'));
    t.ok(listener.calledOnce);
    t.notOk(evented.listens('a'));
  });

  await t.test('passes data to listeners', async t => {
    const evented = new Evented();
    evented.on('a', data => {
      t.equal(data.foo, 'bar');
    });
    evented.fire(new Event('a', { foo: 'bar' }));
  });

  await t.test('passes "target" to listeners', async t => {
    const evented = new Evented();
    evented.on('a', data => {
      t.equal(data.target, evented);
    });
    evented.fire(new Event('a'));
  });

  await t.test('passes "type" to listeners', async t => {
    const evented = new Evented();
    evented.on('a', data => {
      t.deepEqual(data.type, 'a');
    });
    evented.fire(new Event('a'));
  });

  await t.test('removes listeners with "off"', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.on('a', listener);
    evented.off('a', listener);
    evented.fire(new Event('a'));
    t.ok(listener.notCalled);
  });

  await t.test('removes one-time listeners with "off"', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.once('a', listener);
    evented.off('a', listener);
    evented.fire(new Event('a'));
    t.ok(listener.notCalled);
  });

  await t.test('once listener is removed prior to call', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.once('a', () => {
      listener();
      evented.fire(new Event('a'));
    });
    evented.fire(new Event('a'));
    t.ok(listener.calledOnce);
  });

  await t.test('reports if an event has listeners with "listens"', async t => {
    const evented = new Evented();
    evented.on('a', () => {});
    t.ok(evented.listens('a'));
    t.notOk(evented.listens('b'));
  });

  await t.test('does not report true to "listens" if all listeners have been removed', async t => {
    const evented = new Evented();
    const listener = () => {};
    evented.on('a', listener);
    evented.off('a', listener);
    t.notOk(evented.listens('a'));
  });

  await t.test('does not immediately call listeners added within another listener', async t => {
    const evented = new Evented();
    evented.on('a', () => {
      evented.on('a', t.fail.bind(t));
    });
    evented.fire(new Event('a'));
  });

  await t.test('has backward compatibility for fire(string, object) API', async t => {
    const evented = new Evented();
    const listener = t.spy();
    evented.on('a', listener);
    evented.fire('a', { foo: 'bar' });
    t.ok(listener.calledOnce);
    t.ok(listener.firstCall.args[0].foo, 'bar');
  });

  await t.test('on is idempotent', async t => {
    const evented = new Evented();
    const listenerA = t.spy();
    const listenerB = t.spy();
    evented.on('a', listenerA);
    evented.on('a', listenerB);
    evented.on('a', listenerA);
    evented.fire(new Event('a'));
    t.ok(listenerA.calledOnce);
    t.ok(listenerA.calledBefore(listenerB));
  });

  await t.test('evented parents', async t => {
    await t.test('adds parents with "setEventedParent"', async t => {
      const listener = t.spy();
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSource.setEventedParent(eventedSink);
      eventedSink.on('a', listener);
      eventedSource.fire(new Event('a'));
      eventedSource.fire(new Event('a'));
      t.ok(listener.calledTwice);
      t.end();
    });

    await t.test('passes original data to parent listeners', async t => {
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSource.setEventedParent(eventedSink);
      eventedSink.on('a', data => {
        t.equal(data.foo, 'bar');
      });
      eventedSource.fire(new Event('a', { foo: 'bar' }));
      t.end();
    });

    await t.test('attaches parent data to parent listeners', async t => {
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSource.setEventedParent(eventedSink, { foz: 'baz' });
      eventedSink.on('a', data => {
        t.equal(data.foz, 'baz');
      });
      eventedSource.fire(new Event('a', { foo: 'bar' }));
      t.end();
    });

    await t.test('attaches parent data from a function to parent listeners', async t => {
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSource.setEventedParent(eventedSink, () => ({ foz: 'baz' }));
      eventedSink.on('a', data => {
        t.equal(data.foz, 'baz');
      });
      eventedSource.fire(new Event('a', { foo: 'bar' }));
      t.end();
    });

    await t.test('passes original "target" to parent listeners', async t => {
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSource.setEventedParent(eventedSink);
      eventedSource.setEventedParent(null);
      eventedSink.on('a', data => {
        t.equal(data.target, eventedSource);
      });
      eventedSource.fire(new Event('a'));
      t.end();
    });

    await t.test('removes parents with "setEventedParent(null)"', async t => {
      const listener = t.spy();
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSink.on('a', listener);
      eventedSource.setEventedParent(eventedSink);
      eventedSource.setEventedParent(null);
      eventedSource.fire(new Event('a'));
      t.ok(listener.notCalled);
      t.end();
    });

    await t.test('reports if an event has parent listeners with "listens"', async t => {
      const eventedSource = new Evented();
      const eventedSink = new Evented();
      eventedSink.on('a', () => {});
      eventedSource.setEventedParent(eventedSink);
      t.ok(eventedSink.listens('a'));
      t.end();
    });

    await t.test('eventedParent data function is evaluated on every fire', async t => {
      const eventedSource = new Evented();
      const eventedParent = new Evented();
      let i = 0;
      eventedSource.setEventedParent(eventedParent, () => i++);
      eventedSource.on('a', () => {});
      eventedSource.fire(new Event('a'));
      t.equal(i, 1);
      eventedSource.fire(new Event('a'));
      t.equal(i, 2);
      t.end();
    });
  });
});
