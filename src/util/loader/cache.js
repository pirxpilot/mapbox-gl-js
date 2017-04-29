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

function keyFromParams({ coord, zoom, fontstack, range, url, _ilk }) {
    if (_ilk) {
        return {
            store: _ilk,
            key: url
        };
    }
    return fontstack ? {
        store: 'font',
        key: [ fontstack, range ]
    } : {
        store: 'tile',
        key: [ coord.x, coord.y, zoom ]
    };
}

function noop() {}
