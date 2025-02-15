const {test} = require('../util/mapbox-gl-js-test');
const fs = require('fs');

test('dev build contains asserts', async (t) => {
    t.assert.ok(fs.readFileSync('dist/mapbox-gl-dev.js', 'utf8').indexOf('canary assert') !== -1);
    t.end();
});
