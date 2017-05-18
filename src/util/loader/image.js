'use strict';

const loader = require('./index');
const window = require('../window');

const load = loader();

module.exports = image;

function image(url, fn) {
    load({ url, _ilk: 'image' }, done);

    function done(err, data) {
        if (err) { return fn(err); }
        if (data.data.byteLength === 0) {
            transparentImage(fn);
        } else {
            imageFromData(data, fn);
        }
    }
}

function imageFromData(imgData, fn) {
    const blob = new window.Blob([imgData.data], { type: 'image/png' });
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
