'use strict';

const browser = require('../util/browser');
const { normalizeSpriteURL } = require('../util/mapbox');
const { RGBAImage } = require('../util/image');
const loadImage = require('../util/loader/image');
const loadJSON = require('../util/loader/json');

module.exports = function(baseURL, callback) {
    let json, image, error;
    const format = browser.devicePixelRatio > 1 ? '@2x' : '';

    loadJSON(normalizeSpriteURL(baseURL, format, '.json'), (err, data) => {
        if (!error) {
            error = err;
            json = data;
            maybeComplete();
        }
    });

    loadImage(normalizeSpriteURL(baseURL, format, '.png'), (err, img) => {
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
};
