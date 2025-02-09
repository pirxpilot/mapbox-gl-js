'use strict';

const { normalizeURL } = require('../util/urls');
const makeLoader = require('../util/loader');
const config = require('../util/config');
const parseGlyphPBF = require('./parse_glyph_pbf');
const { callback } = require('../util/callback');

module.exports = loadGlyphRange;

async function loadGlyphRange(fontstack, range, urlTemplate, fn) {
    if (typeof urlTemplate === 'function') {
        return callback(done, perform());

        async function perform() {
            const data = await urlTemplate(fontstack, range);
            if (data) {
                return { data };
            }
        }
    }
    const begin = range * 256;
    const end = begin + 255;

    const url = normalizeURL(
        urlTemplate
            .replace('{fontstack}', fontstack)
            .replace('{range}', `${begin}-${end}`)
    );

    const loader = makeLoader(config.LOADER_STRATEGY);
    loader({ request: { url }, fontstack, range }, done);

    function done(err, { data } = {}) {
        if (err) return fn(err);
        const glyphs = {};
        if (data) {
            for (const glyph of parseGlyphPBF(data)) {
                glyphs[glyph.id] = glyph;
            }
        }
        fn(null, glyphs);
    }
}
