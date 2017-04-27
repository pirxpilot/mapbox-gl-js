'use strict';

const { normalizeGlyphsURL } = require('../util/mapbox');
const makeLoader = require('../util/loader');
const parseGlyphPBF = require('./parse_glyph_pbf');


const loader = makeLoader('cache-first-then-cache');

module.exports = function (fontstack, range, urlTemplate, callback) {
    const begin = range * 256;
    const end = begin + 255;

    const url = normalizeGlyphsURL(urlTemplate)
        .replace('{fontstack}', fontstack)
        .replace('{range}', `${begin}-${end}`);

    loader({ url, fontstack, range }, done);

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
};
