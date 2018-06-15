'use strict';

const tileCache = require('tile-cache');

module.exports = { from, update };

// 24 hours for cached tiles
const cacheControl = 'max-age:86400';

function from(params, fn) {
    const { store, key } = keyFromParams(params);
    tileCache.get(store, key, done);
    function done(err, data) {
        if (!err && !data) {
            err = new Error('Cache miss');
        }
        fn(err, data && {
            data,
            cacheControl,
            _cacheHit: true
        });
    }
}

function update(params, { data, _cacheHit }, fn = noop) {
    if (_cacheHit) {
        return fn();
    }
    const { store, key } = keyFromParams(params);
    tileCache.put(store, key, data, fn);
}

function keyFromParams({ tileID, fontstack, range, request, _ilk }) {
    if (_ilk) {
        return {
            store: _ilk,
            key: request.url
        };
    }
    if (fontstack) {
        return {
            store: 'font',
            key: [ fontstack, parseInt(range, 10) ]
        };
    }
    const { x, y, z } = tileID.canonical;
    return fontstack ? {
    } : {
        store: 'tile',
        key: [ x, y, z ]
    };
}

function noop() {}
