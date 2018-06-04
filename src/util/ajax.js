'use strict';

const window = require('./window');


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
    getVideo
};

if (typeof Object.freeze == 'function') {
    Object.freeze(ResourceType);
}

/**
 * A `RequestParameters` object to be returned from Map.options.transformRequest callbacks.
 * @typedef {Object} RequestParameters
 * @property {string} url The URL to be requested.
 * @property {Object} headers The headers to be sent with the request.
 * @property {string} credentials `'same-origin'|'include'` Use 'include' to send cookies with cross-origin requests.
 */

class AJAXError extends Error {
    constructor(message, status, url) {
        super(message);
        this.status = status;
        this.url = url;

        // work around for https://github.com/Rich-Harris/buble/issues/40
        this.name = this.constructor.name;
        this.message = message;
    }

    toString() {
        return `${this.name}: ${this.message} (${this.status}): ${this.url}`;
    }
}

function makeRequest(requestParameters) {
    const xhr = new window.XMLHttpRequest();

    xhr.open('GET', requestParameters.url, true);
    for (const k in requestParameters.headers) {
        xhr.setRequestHeader(k, requestParameters.headers[k]);
    }
    xhr.withCredentials = requestParameters.credentials === 'include';
    return xhr;
}

function getJSON(requestParameters, callback) {
    const xhr = makeRequest(requestParameters);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = function() {
        callback(new Error(xhr.statusText));
    };
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            let data;
            try {
                data = JSON.parse(xhr.response);
            } catch (err) {
                return callback(err);
            }
            callback(null, data);
        } else {
            if (xhr.status === 401 && requestParameters.url.match(/mapbox.com/)) {
                callback(new AJAXError(`${xhr.statusText}: you may have provided an invalid Mapbox access token. See https://www.mapbox.com/api-documentation/#access-tokens`, xhr.status, requestParameters.url));
            } else {
                callback(new AJAXError(xhr.statusText, xhr.status, requestParameters.url));
            }
        }
    };
    xhr.send();
    return xhr;
}

function getArrayBuffer(requestParameters, callback) {
    const xhr = makeRequest(requestParameters);
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function() {
        callback(new Error(xhr.statusText));
    };
    xhr.onload = function() {
        const response = xhr.response;
        if (response.byteLength === 0 && xhr.status === 200) {
            return callback(new Error('http status 200 returned without content.'));
        }
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            callback(null, {
                data: response,
                cacheControl: xhr.getResponseHeader('Cache-Control'),
                expires: xhr.getResponseHeader('Expires')
            });
        } else {
            callback(new AJAXError(xhr.statusText, xhr.status, requestParameters.url));
        }
    };
    xhr.send();
    return xhr;
}

function sameOrigin(url) {
    const a = window.document.createElement('a');
    a.href = url;
    return a.protocol === window.document.location.protocol && a.host === window.document.location.host;
}

const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

function getImage(requestParameters, callback) {
    // request the image with XHR to work around caching issues
    // see https://github.com/mapbox/mapbox-gl-js/issues/1470
    return getArrayBuffer(requestParameters, (err, imgData) => {
        if (err) {
            callback(err);
        } else if (imgData) {
            const img = new window.Image();
            const URL = window.URL || window.webkitURL;
            img.onload = () => {
                callback(null, img);
                URL.revokeObjectURL(img.src);
            };
            const blob = new window.Blob([new Uint8Array(imgData.data)], { type: 'image/png' });
            (img).cacheControl = imgData.cacheControl;
            (img).expires = imgData.expires;
            img.src = imgData.data.byteLength ? URL.createObjectURL(blob) : transparentPngUrl;
        }
    });
}

function getVideo(urls, callback) {
    const video = window.document.createElement('video');
    video.onloadstart = function() {
        callback(null, video);
    };
    for (let i = 0; i < urls.length; i++) {
        const s = window.document.createElement('source');
        if (!sameOrigin(urls[i])) {
            video.crossOrigin = 'Anonymous';
        }
        s.src = urls[i];
        video.appendChild(s);
    }
    return video;
}
