const { test } = require('mapbox-gl-js-test');
const { normalizeSpriteURL, normalizeURL } = require('../../../src/util/urls');
const config = require('../../../src/util/config');

test("mapbox", async (t) => {
    await t.test('.normalizeURL', async (t) => {
        await t.test('ignores non-relative URLs', async (t) => {
            t.equal(normalizeURL('http://path/style.json'), 'http://path/style.json');
            t.end();
        });

        await t.test('handles custom BASE_URLs with paths', async (t) => {
            const previousUrl = config.BASE_URL;
            config.BASE_URL = 'https://test.example.com/api.mapbox.com';
            t.equal(
                normalizeURL('/fonts/boxmap/Arial/0-255.pbf'),
                'https://test.example.com/fonts/boxmap/Arial/0-255.pbf'
            );
            config.BASE_URL = previousUrl;
            t.end();
        });

        t.end();
    });

    await t.test('.normalizeSpriteURL', async (t) => {
        await t.test('concantenates path, ratio, and extension for non-relative scheme', async (t) => {
            t.equal(normalizeSpriteURL('http://www.foo.com/bar', '@2x', '.png'), 'http://www.foo.com/bar@2x.png');
            t.end();
        });

        await t.test('concantenates path, ratio, and extension for file:/// scheme', async (t) => {
            t.equal(normalizeSpriteURL('file:///path/to/bar', '@2x', '.png'), 'file:///path/to/bar@2x.png');
            t.end();
        });

        await t.test('normalizes non-relative scheme when query string exists', async (t) => {
            t.equal(
                normalizeSpriteURL('http://www.foo.com/bar?fresh=true', '@2x', '.png'),
                'http://www.foo.com/bar@2x.png?fresh=true'
            );
            t.end();
        });

        await t.test('handles custom BASE_URLs with paths', async (t) => {
            const previousUrl = config.BASE_URL;
            config.BASE_URL = 'https://test.example.com/api.mapbox.com';
            t.equal(
                normalizeSpriteURL('sprites/mapbox/streets-v8', '', '.json'),
                'https://test.example.com/sprites/mapbox/streets-v8.json'
            );
            config.BASE_URL = previousUrl;
            t.end();
        });

        t.end();
    });

    t.end();
});
