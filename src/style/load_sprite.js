'use strict';

const browser = require('../util/browser');
const { normalizeSpriteURL, normalizeURL } = require('../util/urls');
const { RGBAImage } = require('../util/image');
const loadImage = require('../util/loader/image');
const loadJSON = require('../util/loader/json');

module.exports = loadSprite;

function urlsFromBase(baseURL) {
    const format = browser.devicePixelRatio > 1 ? '@2x' : '';
    return {
        json: normalizeSpriteURL(baseURL, format, '.json'),
        src: normalizeSpriteURL(baseURL, format, '.png')
    };
}

function urlsFromData(urls) {
    let index = Math.round(browser.devicePixelRatio || 1) - 1;
    if (index >= urls.length) {
        index = urls.length - 1;
    }
    const bestMatch = urls[index];
    return {
        json: normalizeURL(bestMatch.json),
        src: normalizeURL(bestMatch.src || bestMatch.png)
    };
}

function loadSprite(baseURL, callback) {
    let json, image, error;
    const urls = Array.isArray(baseURL) ? urlsFromData(baseURL) : urlsFromBase(baseURL);

    loadJSON(urls.json, (err, data) => {
        if (!error) {
            error = err;
            json = data;
            maybeComplete();
        }
    });

    loadImage(urls.src, (err, img) => {
        if (!error) {
            error = err;
            image = img;
            maybeComplete();
        }
    });

    function maybeComplete() {
        if (error) {
            callback(error);
        } else if (json && image) {
            const imageData = browser.getImageData(image);
            const result = {};

            for (const id in json) {
                const {width, height, x, y, sdf, pixelRatio} = json[id];
                const data = new RGBAImage({width, height});
                RGBAImage.copy(imageData, data, {x, y}, {x: 0, y: 0}, {width, height});
                result[id] = {data, pixelRatio, sdf};
            }

            callback(null, result);
        }
    }
}
