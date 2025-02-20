const { globSync, readFileSync, writeFileSync } = require('node:fs');
const { test } = require('../../util/mapbox-gl-js-test');
const path = require('path');
const validate = require('../../../src/style-spec/validate_style');

const UPDATE = !!process.env.UPDATE;

globSync(`${__dirname}/fixture/*.input.json`).forEach(file => {
  test(path.basename(file), t => {
    const outputfile = file.replace('.input', '.output');
    const style = readFileSync(file);
    const result = validate(style);
    if (UPDATE) {
      writeFileSync(outputfile, JSON.stringify(result, null, 2));
    }
    const expect = JSON.parse(readFileSync(outputfile));
    if (expect[0]?.error) {
      t.assert.equal(result[0].message, expect[0].message);
    } else {
      t.assert.deepEqual(result, expect);
    }
  });
});

const fixtures = globSync(`${__dirname}/fixture/*.input.json`);
const style = JSON.parse(readFileSync(fixtures[0]));
const reference = require('../../../src/style-spec/reference/latest');

test('validate.parsed exists', { skip: true }, t => {
  t.assert.equal(typeof validate.parsed, 'function');
});

test('errors from validate.parsed do not contain line numbers', { skip: true }, t => {
  const result = validate.parsed(style, reference);
  t.assert.equal(result[0].line, undefined);
});

test('validate.latest exists', { skip: true }, t => {
  t.assert.equal(typeof validate.latest, 'function');
});

test('errors from validate.latest do not contain line numbers', { skip: true }, t => {
  const result = validate.latest(style);
  t.assert.equal(result[0].line, undefined);
});
