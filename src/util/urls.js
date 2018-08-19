'use strict';

const config = require('./config');

module.exports = {
    normalizeSpriteURL,
    normalizeURL
};

/* global URL */

function normalizeURL(url) {
    return new URL(url, config.BASE_URL).href;
}

function normalizeSpriteURL(url, format, extension) {
    const urlObject = new URL(url, config.BASE_URL);
    urlObject.pathname += format + extension;
    return urlObject.href;
}
