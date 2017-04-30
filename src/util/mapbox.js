'use strict';

const config = require('./config');

const help = 'See https://www.mapbox.com/api-documentation/#access-tokens';

module.exports = {
    normalizeStyleURL,
    normalizeGlyphsURL,
    normalizeSourceURL,
    normalizeSpriteURL,
    normalizeTileURL
};

function makeAPIURL(urlObject, accessToken) {
    const apiUrlObject = parseUrl(config.API_URL);
    urlObject.protocol = apiUrlObject.protocol;
    urlObject.authority = apiUrlObject.authority;

    if (apiUrlObject.path !== '/') {
        urlObject.path = `${apiUrlObject.path}${urlObject.path}`;
    }

    if (!config.REQUIRE_ACCESS_TOKEN) return formatUrl(urlObject);

    accessToken = accessToken || config.ACCESS_TOKEN;
    if (!accessToken)
        throw new Error(`An API access token is required to use Mapbox GL. ${help}`);
    if (accessToken[0] === 's')
        throw new Error(`Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*). ${help}`);

    urlObject.params.push(`access_token=${accessToken}`);
    return formatUrl(urlObject);
}

function isMapboxURL(url) {
    return url.indexOf('mapbox:') === 0;
}

function normalizeStyleURL(url, accessToken) {
    if (!isMapboxURL(url)) return url;
    const urlObject = parseUrl(url);
    urlObject.path = `/styles/v1${urlObject.path}`;
    return makeAPIURL(urlObject, accessToken);
}

function normalizeGlyphsURL(url, accessToken) {
    if (!isMapboxURL(url)) return url;
    const urlObject = parseUrl(url);
    urlObject.path = `/fonts/v1${urlObject.path}`;
    return makeAPIURL(urlObject, accessToken);
}

function normalizeSourceURL(url, accessToken) {
    if (!isMapboxURL(url)) return url;
    const urlObject = parseUrl(url);
    urlObject.path = `/v4/${urlObject.authority}.json`;
    // TileJSON requests need a secure flag appended to their URLs so
    // that the server knows to send SSL-ified resource references.
    urlObject.params.push('secure');
    return makeAPIURL(urlObject, accessToken);
}

function normalizeSpriteURL(url, format, extension, accessToken) {
    const urlObject = parseUrl(url);
    if (!isMapboxURL(url)) {
        urlObject.path += `${format}${extension}`;
        return formatUrl(urlObject);
    }
    urlObject.path = `/styles/v1${urlObject.path}/sprite${format}${extension}`;
    return makeAPIURL(urlObject, accessToken);
}

function normalizeTileURL(tileURL, sourceURL) {
    if (!sourceURL || !isMapboxURL(sourceURL)) return tileURL;

    const urlObject = parseUrl(tileURL);

    replaceTempAccessToken(urlObject.params);
    return formatUrl(urlObject);
}

function replaceTempAccessToken(params) {
    for (let i = 0; i < params.length; i++) {
        if (params[i].indexOf('access_token=tk.') === 0) {
            params[i] = `access_token=${config.ACCESS_TOKEN || ''}`;
        }
    }
}

const urlRe = /^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;

function parseUrl(url) {
    const parts = url.match(urlRe);
    if (!parts) {
        throw new Error('Unable to parse URL object');
    }
    return {
        protocol: parts[1],
        authority: parts[2],
        path: parts[3] || '/',
        params: parts[4] ? parts[4].split('&') : []
    };
}

function formatUrl(obj) {
    const params = obj.params.length ? `?${obj.params.join('&')}` : '';
    return `${obj.protocol}://${obj.authority}${obj.path}${params}`;
}
