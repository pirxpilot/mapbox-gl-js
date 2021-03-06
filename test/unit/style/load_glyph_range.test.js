'use strict';

const { test } = require('mapbox-gl-js-test');
const fs = require('fs');
const path = require('path');
const window = require('../../../src/util/window');
const loadGlyphRange = require('../../../src/style/load_glyph_range');

test('loadGlyphRange', (t) => {
    window.useFakeXMLHttpRequest();

    t.tearDown(() => {
        window.restore();
    });

    let request;
    window.XMLHttpRequest.onCreate = (req) => { request = req; };

    loadGlyphRange('Arial Unicode MS', 0, 'https://localhost/fonts/v1/{fontstack}/{range}.pbf', (err, result) => {
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

    if (!request) return t.fail(); // appease flow

    t.equal(request.url, 'https://localhost/fonts/v1/Arial%20Unicode%20MS/0-255.pbf');
    request.setStatus(200);
    request.response = fs.readFileSync(path.join(__dirname, '../../fixtures/0-255.pbf'));
    request.onload();

});
