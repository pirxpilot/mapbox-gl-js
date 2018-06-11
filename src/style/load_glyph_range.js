'use strict';

const { normalizeGlyphsURL } = require('../util/mapbox');
const makeLoader = require('../util/loader');
const config = require('../util/config');
const parseGlyphPBF = require('./parse_glyph_pbf');

module.exports = loadGlyphRange;

function loadGlyphRange(fontstack, range, urlTemplate, callback) {
    const begin = range * 256;
    const end = begin + 255;

    const url = normalizeGlyphsURL(urlTemplate)
        .replace('{fontstack}', fontstack)
        .replace('{range}', `${begin}-${end}`);

    const loader = makeLoader(config.LOADER_STRATEGY);
    loader({ request: { url }, fontstack, range }, done);

    function done(err, { data } = {}) {
        if (err) return callback(err);
        const glyphs = {};
        if (data) {
            for (const glyph of parseGlyphPBF(data)) {
                glyphs[glyph.id] = glyph;
            }
        }
        callback(null, glyphs);
    }
}
