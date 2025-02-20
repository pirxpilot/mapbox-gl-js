require('./mapbox-gl-js-test/glsl-loader');

const test = require('node:test');
const sinon = require('sinon');

module.exports = {
  test
};

test.beforeEach(t => {
  t.assert.notOk = (cond, ...args) => t.assert.ok(!cond, ...args);
  t.comment = () => {};
  t.throws = (fn, error, ...args) => {
    if (args.length > 0 && typeof error === 'string') {
      error = { message: error };
    }
    return t.assert.throws(fn, error, ...args);
  };
  t.pass = () => t.assert.ok(true);
  t.equalWithPrecision = assertEqualWithPrecision;
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
