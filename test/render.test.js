require('./util/mapbox-gl-js-test/glsl-loader');

globalThis.window ??= require('./util/window');

const suite = require('./integration').render;
const suiteImplementation = require('./suite_implementation');
const ignores = require('./ignores.json');

suite.run('js', ignores, suiteImplementation);
