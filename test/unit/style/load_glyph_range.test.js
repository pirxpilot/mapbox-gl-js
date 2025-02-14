'use strict';

const { test } = require('mapbox-gl-js-test');
const fs = require('fs');
const path = require('path');
const loadGlyphRange = require('../../../src/style/load_glyph_range');

test('loadGlyphRange', t => {
  function load(fontstack, range) {
    t.equal(fontstack, 'Arial Unicode MS');
    t.equal(range, 0);
    return fs.readFileSync(path.join(__dirname, '../../fixtures/0-255.pbf'));
  }

  loadGlyphRange('Arial Unicode MS', 0, load, (err, result) => {
    t.ifError(err);

    if (!result) return t.fail(); // appease flow

    t.equal(Object.keys(result).length, 223);
    for (const key in result) {
      const id = Number(key);
      const glyph = result[id];
      if (!glyph) return t.fail(); // appease flow
      t.equal(glyph.id, Number(id));
      t.ok(glyph.metrics);
      t.equal(typeof glyph.metrics.width, 'number');
      t.equal(typeof glyph.metrics.height, 'number');
      t.equal(typeof glyph.metrics.top, 'number');
      t.equal(typeof glyph.metrics.advance, 'number');
    }
    t.end();
  });
});
