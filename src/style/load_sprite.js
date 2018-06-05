'use strict';

const browser = require('../util/browser');
const { normalizeSpriteURL } = require('../util/mapbox');
const { RGBAImage } = require('../util/image');
const loadImage = require('../util/loader/image');
const loadJSON = require('../util/loader/json');
const async = require('../util/async');

module.exports = loadSprite;

function loadSprite(baseURL, fn) {
    const format = browser.devicePixelRatio > 1 ? '@2x' : '';

    const urls = [
        '.json',
        '.png'
    ].map(suffix => normalizeSpriteURL(baseURL, format, suffix));

    async.all(
        urls,
        (url, i, fn) => i > 0 ? loadImage(url, fn) : loadJSON(url, fn),
        done
    );

    function done(err, [ json, image ] = []) {
        if (err) return fn(err);

        const imageData = browser.getImageData(image);

        function convert(result, { width, height, x, y, sdf, pixelRatio }, id) {
            const data = new RGBAImage({width, height});
            RGBAImage.copy(imageData, data, {x, y}, {x: 0, y: 0}, {width, height});
            result[id] = { data, pixelRatio, sdf };
            return result;
        }

        const result = json.reduce(convert, {});

        fn(null, result);
    }
}
