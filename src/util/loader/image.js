'use strict';

const config = require('../config');
const loader = require('./index');
const window = require('../window');

module.exports = image;
module.exports.load = loadImage;

function loadImage(load, data, fn) {
    if (data instanceof ArrayBuffer) {
        // 24 hours for cached tiles
        done(null, { data, cacheControl: 'max-age=3600' });
        return;
    }
    const url = data;
    load({ request: { url }, _ilk: 'image' }, done);

    function done(err, data) {
        if (err) return fn(err);
        if (data.data.byteLength === 0) {
            transparentImage(fn);
        } else {
            imageFromData(data, fn);
        }
    }
}

function image(url, fn) {
    const load = loader(config.LOADER_STRATEGY);
    loadImage(load, url, fn);
}

function imageFromData(imgData, fn) {
    const blob = new window.Blob([imgData.data], { type: imgData.type || 'image/png' });
    const img = new window.Image();

    img.onload = () => {
        fn(null, img);
        window.URL.revokeObjectURL(img.src);
    };
    img.cacheControl = imgData.cacheControl;
    img.expires = imgData.expires;
    img.src = window.URL.createObjectURL(blob);
}

const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

function transparentImage(fn) {
    const img = new window.Image();
    img.onload = () => fn(null, img);
    img.src = transparentPngUrl;
}
