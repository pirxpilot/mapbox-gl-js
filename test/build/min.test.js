const {test} = require('../util/mapbox-gl-js-test');
const fs = require('fs');
const path = require('path');
const reference = require('../../src/style-spec/reference/latest');
const { Linter } = require('eslint');
const { scripts } = require('../../package.json');

const minBundle = fs.readFileSync('dist/mapbox-gl.js', 'utf8');

test('production build removes asserts', async (t) => {
    t.assert.ok(minBundle.indexOf('canary assert') === -1);
    t.end();
});

test('trims package.json assets', async (t) => {
    // confirm that the entire package.json isn't present by asserting
    // the absence of each of our script strings
    for (const name in scripts) {
        t.assert.ok(minBundle.indexOf(scripts[name]) === -1);
    }
    t.end();
});

test('trims reference.json fields', async (t) => {
    t.assert.ok(reference.$root.version.doc);
    t.assert.ok(minBundle.indexOf(reference.$root.version.doc) === -1);
    t.end();
});

test('can be browserified', async (t) => {
    const browserify = require('browserify');
    browserify(path.join(__dirname, 'browserify-test-fixture.js')).bundle((err) => {
        t.ifError(err);
        t.end();
    });
});

test('distributed in plain ES5 code', async (t) => {
    const linter = new Linter();
    const messages = linter.verify(minBundle, {
        parserOptions: {
            ecmaVersion: 5
        },
        rules: {},
        env: {
            node: true
        }
    });
    t.deepEqual(messages.map(message => `${message.line}:${message.column}: ${message.message}`), []);
    t.end();
});

