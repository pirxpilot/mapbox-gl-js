'use strict';

const { normalizeGlyphsURL } = require('../util/mapbox');

const { getArrayBuffer } = require('../util/ajax');
const parseGlyphPBF = require('./parse_glyph_pbf');


module.exports = function (fontstack,
                           range,
                           urlTemplate,
                           callback) {
    const begin = range * 256;
    const end = begin + 255;

    const url = normalizeGlyphsURL(urlTemplate)
            .replace('{fontstack}', fontstack)
            .replace('{range}', `${begin}-${end}`);

    getArrayBuffer({ url }, (err, response) => {
        if (err) {
            callback(err);
        } else if (response) {
            const glyphs = {};

            for (const glyph of parseGlyphPBF(response.data)) {
                glyphs[glyph.id] = glyph;
            }

            callback(null, glyphs);
        }
    });
};
