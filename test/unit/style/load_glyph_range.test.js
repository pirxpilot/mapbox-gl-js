const { test } = require('../../util/mapbox-gl-js-test');
const fs = require('fs');
const path = require('path');
const loadGlyphRange = require('../../../src/style/load_glyph_range');

test('loadGlyphRange', (t, done) => {
  function load(fontstack, range) {
    t.assert.equal(fontstack, 'Arial Unicode MS');
    t.assert.equal(range, 0);
    return fs.readFileSync(path.join(__dirname, '../../fixtures/0-255.pbf'));
  }

  loadGlyphRange('Arial Unicode MS', 0, load, (err, result) => {
    t.assert.ifError(err);

    if (!result) return t.assert.fail(); // appease flow

    t.assert.equal(Object.keys(result).length, 223);
    for (const key in result) {
      const id = Number(key);
      const glyph = result[id];
      if (!glyph) return t.assert.fail(); // appease flow
      t.assert.equal(glyph.id, Number(id));
      t.assert.ok(glyph.metrics);
      t.assert.equal(typeof glyph.metrics.width, 'number');
      t.assert.equal(typeof glyph.metrics.height, 'number');
      t.assert.equal(typeof glyph.metrics.top, 'number');
      t.assert.equal(typeof glyph.metrics.advance, 'number');
    }
    done();
  });
});
