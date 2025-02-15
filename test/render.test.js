require('./util/mapbox-gl-js-test/glsl-loader');

const suite = require('./integration').render;
const suiteImplementation = require('./suite_implementation');
const ignores = require('./ignores.json');

globalThis.window ??= require('../src/util/window');

suite.run('js', ignores, suiteImplementation);
