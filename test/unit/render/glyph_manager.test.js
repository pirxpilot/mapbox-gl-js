const { test } = require('mapbox-gl-js-test');
const parseGlyphPBF = require('../../../src/style/parse_glyph_pbf');
const GlyphManager = require('../../../src/render/glyph_manager');
const fs = require('fs');

const glyphs = {};
for (const glyph of parseGlyphPBF(fs.readFileSync('./test/fixtures/0-255.pbf'))) {
  glyphs[glyph.id] = glyph;
}

test('GlyphManager requests 0-255 PBF', (t, done) => {
  function glyphLoader() {}

  t.stub(GlyphManager, 'loadGlyphRange').callsFake((stack, range, load, callback) => {
    t.equal(stack, 'Arial Unicode MS');
    t.equal(range, 0);
    t.equal(load, glyphLoader);
    setImmediate(() => callback(null, glyphs));
  });

  const manager = new GlyphManager();
  manager.setGlyphsLoader(glyphLoader);

  manager.getGlyphs({ 'Arial Unicode MS': [55] }, (err, glyphs) => {
    t.ifError(err);
    t.equal(glyphs['Arial Unicode MS']['55'].metrics.advance, 12);
    done();
  });
});

test('GlyphManager requests remote CJK PBF', (t, done) => {
  t.stub(GlyphManager, 'loadGlyphRange').callsFake((stack, range, load, callback) => {
    setImmediate(() => callback(null, glyphs));
  });

  const manager = new GlyphManager();
  manager.setGlyphsLoader(() => {});

  manager.getGlyphs({ 'Arial Unicode MS': [0x5e73] }, (err, glyphs) => {
    t.ifError(err);
    t.equal(glyphs['Arial Unicode MS'][0x5e73], null); // The fixture returns a PBF without the glyph we requested
    done();
  });
});

test('GlyphManager generates CJK PBF locally', (t, done) => {
  t.stub(GlyphManager, 'TinySDF').value(
    class {
      // Return empty 30x30 bitmap (24 fontsize + 3 * 2 buffer)
      draw() {
        return new Uint8ClampedArray(900);
      }
    }
  );

  const manager = new GlyphManager('sans-serif');
  manager.setGlyphsLoader(() => {});

  manager.getGlyphs({ 'Arial Unicode MS': [0x5e73] }, (err, glyphs) => {
    t.ifError(err);
    t.equal(glyphs['Arial Unicode MS'][0x5e73].metrics.advance, 24);
    done();
  });
});
