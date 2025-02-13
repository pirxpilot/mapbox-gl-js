/* eslint-disable import/unambiguous, import/no-commonjs, no-global-assign */

const suite = require('./integration').render;
const suiteImplementation = require('./suite_implementation');
const ignores = require('./ignores.json');

suite.run('js', ignores, suiteImplementation);
