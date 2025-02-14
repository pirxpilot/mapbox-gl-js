const replace = require('rollup-plugin-replace');
const buble = require('rollup-plugin-buble');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const unassert = require('rollup-plugin-unassert');
const json = require('rollup-plugin-json');
const { flow } = require('../../build/rollup_plugins');

const config = [
  {
    input: `${__dirname}/style-spec.js`,
    output: {
      name: 'mapboxGlStyleSpecification',
      file: `${__dirname}/dist/index.js`,
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      // https://github.com/zaach/jison/issues/351
      replace({
        include: /\/jsonlint-lines-primitives\/lib\/jsonlint.js/,
        delimiters: ['', ''],
        values: {
          '_token_stack:': ''
        }
      }),
      flow(),
      json(),
      buble({ transforms: { dangerousForOf: true }, objectAssign: 'Object.assign' }),
      unassert(),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  }
];
module.exports = config;
