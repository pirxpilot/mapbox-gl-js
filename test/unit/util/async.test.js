const test = require('../../util/mapbox-gl-js-test').test;
const async = require('../../../src/util/async');

test('async', async t => {
  await t.test('asyncAll - sync', (t, done) => {
    async.all(
      [0, 1, 2],
      (data, callback) => {
        callback(null, data);
      },
      (err, results) => {
        t.ifError(err);
        t.deepEqual(results, [0, 1, 2]);
        done();
      }
    );
  });

  await t.test('asyncAll - async', (t, done) => {
    async.all(
      [4, 0, 1, 2],
      (data, callback) => {
        setTimeout(() => {
          callback(null, data);
        }, data);
      },
      (err, results) => {
        t.ifError(err);
        t.deepEqual(results, [4, 0, 1, 2]);
        done();
      }
    );
  });

  await t.test('asyncAll - error', (t, done) => {
    async.all(
      [4, 0, 1, 2],
      (data, callback) => {
        setTimeout(() => {
          callback(new Error('hi'), data);
        }, data);
      },
      (err, results) => {
        t.equal(err?.message, 'hi');
        t.deepEqual(results, [4, 0, 1, 2]);
        done();
      }
    );
  });

  await t.test('asyncAll - empty', (t, done) => {
    async.all(
      [],
      (data, callback) => {
        callback(null, 'foo');
      },
      (err, results) => {
        t.ifError(err);
        t.deepEqual(results, []);
        done();
      }
    );
  });

  await t.test('asyncAll', (t, done) => {
    let expect = 1;
    async.all(
      [],
      callback => {
        callback();
      },
      () => {
        t.ok('immediate callback');
      }
    );
    async.all(
      [1, 2, 3],
      (number, callback) => {
        t.equal(number, expect++);
        t.ok(callback instanceof Function);
        callback(null, 0);
      },
      () => {
        done();
      }
    );
  });
});
