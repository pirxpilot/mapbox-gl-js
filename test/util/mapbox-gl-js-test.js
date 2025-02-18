require('./mapbox-gl-js-test/glsl-loader');

const test = require('node:test');
const sinon = require('sinon');

module.exports = {
  test
};

test.beforeEach(t => {
  t.ok = t.assert.ok;
  t.notOk = (cond, ...args) => t.assert.ok(!cond, ...args);
  t.comment = () => {};
  t.equal = t.assert.equal;
  t.deepEqual = t.assert.deepEqual;
  t.notEqual = t.assert.notEqual;
  t.throws = (fn, error, ...args) => {
    if (args.length > 0 && typeof error === 'string') {
      error = { message: error };
    }
    return t.assert.throws(fn, error, ...args);
  };
  t.doesNotThrow = t.assert.doesNotThrow;
  t.deepEqual = t.assert.deepEqual;
  t.ifError = t.assert.ifError;
  t.same = t.assert.deepEqual;
  t.fail = t.assert.fail;
  t.pass = () => t.assert.ok(true);
  t.equalWithPrecision = assertEqualWithPrecision;
  t.true = t.assert.ok;
  t.false = t.notOk;
  t.match = t.assert.match;
});

test.beforeEach(t => {
  t._sandbox = sinon.createSandbox({
    injectInto: t,
    properties: ['spy', 'stub', 'mock']
  });
});

test.afterEach(t => {
  t._sandbox.restore();
});

function assertEqualWithPrecision(expected, actual, multiplier, message) {
  const expectedRounded = Math.round(expected / multiplier) * multiplier;
  const actualRounded = Math.round(actual / multiplier) * multiplier;

  return this.assert.equal(expectedRounded, actualRounded, message ?? `should be equal to within ${multiplier}`);
}
