'use strict';

const window = require('./window');

module.exports = {
    getJSON,
    getArrayBuffer
};

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
    if (!requestParameters.url) {
        return;
    }
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
    if (!xhr) {
        return callback(new AJAXError('Missing URL'));
    }
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
            callback(null, { data });
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
    if (!xhr) {
        return callback(new AJAXError('Missing URL'));
    }
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
                type: xhr.getResponseHeader('Content-Type'),
                expires: xhr.getResponseHeader('Expires')
            });
        } else {
            callback(new AJAXError(xhr.statusText, xhr.status, requestParameters.url));
        }
    };
    xhr.send();
    return xhr;
}
