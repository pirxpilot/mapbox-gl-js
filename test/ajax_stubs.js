const {PNG} = require('pngjs');
const request = require('request');
// we're using a require hook to load this file instead of src/util/ajax.js,
// so we import browser module as if it were in an adjacent file
const browser = require('./browser'); // eslint-disable-line import/no-unresolved
const cache = {};

/**
 * The type of a resource.
 * @private
 * @readonly
 * @enum {string}
 */
const ResourceType = {
    Unknown: 'Unknown',
    Style: 'Style',
    Source: 'Source',
    Tile: 'Tile',
    Glyphs: 'Glyphs',
    SpriteImage: 'SpriteImage',
    SpriteJSON: 'SpriteJSON',
    Image: 'Image'
};

module.exports = {
    ResourceType,
    getJSON,
    getArrayBuffer,
    getImage,
    getVideo,
};

if (typeof Object.freeze === 'function') {
    Object.freeze(ResourceType);
}

function cached(data, callback) {
    setImmediate(() => {
        callback(null, data);
    });
}

function getJSON({ url }, callback) {
    if (cache[url]) return cached(cache[url], callback);
    return request(url, (error, response, body) => {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            let data;
            try {
                data = JSON.parse(body);
            } catch (err) {
                return callback(err);
            }
            cache[url] = data;
            callback(null, data);
        } else {
            callback(error || new Error(response.statusCode));
        }
    });
}

function getArrayBuffer({ url }, callback) {
    if (cache[url]) return cached(cache[url], callback);
    return request({ url, encoding: null }, (error, response, body) => {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            cache[url] = {data: body};
            callback(null, {data: body});
        } else {
            callback(error || new Error(response.statusCode));
        }
    });
}

function getImage({ url }, callback) {
    if (cache[url]) return cached(cache[url], callback);
    return request({ url, encoding: null }, (error, response, body) => {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            new PNG().parse(body, (err, png) => {
                if (err) return callback(err);
                cache[url] = png;
                callback(null, png);
            });
        } else {
            callback(error || {status: response.statusCode});
        }
    });
}

browser.getImageData = function({width, height, data}) {
    return {width, height, data: new Uint8Array(data)};
};

// Hack: since node doesn't have any good video codec modules, just grab a png with
// the first frame and fake the video API.
function getVideo(urls, callback) {
    return request({ url: urls[0], encoding: null }, (error, response, body) => {
        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
            new PNG().parse(body, (err, png) => {
                if (err) return callback(err);
                callback(null, {
                    readyState: 4, // HAVE_ENOUGH_DATA
                    addEventListener: function() {},
                    play: function() {},
                    width: png.width,
                    height: png.height,
                    data: png.data
                });
            });
        } else {
            callback(error || new Error(response.statusCode));
        }
    });
}
