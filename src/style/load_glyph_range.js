const parseGlyphPBF = require('./parse_glyph_pbf');
const { callback } = require('../util/callback');

module.exports = loadGlyphRange;

function loadGlyphRange(fontstack, range, load, fn) {
  return callback(fn, perform());

  async function perform() {
    const data = await load(fontstack, range);
    const glyphs = {};
    for (const glyph of parseGlyphPBF(data)) {
      glyphs[glyph.id] = glyph;
    }
    return glyphs;
  }
}
