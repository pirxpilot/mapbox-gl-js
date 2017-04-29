'use strict';

const ajax = require('../ajax');
const tileCache = require('tile-cache');

module.exports = selectStrategy;

const strategies = {
    'network-only': networkOnly,
    'network-first': networkFirst,
    'cache-only': cacheOnly,
    'cache-first': cacheFirst,
    'network-then-cache': networkThenCache,
    'cache-first-then-cache': cacheFirstThenCache
};

// 24 hours for cached tiles
const cacheControl = 'max-age:86400';

function selectStrategy(strategy = 'network-only') {
    return strategies[strategy] || strategies['network-only'];
}

function networkOnly({ url, _ilk }, fn) {
    const getFn = _ilk === 'json' ? ajax.getJSON : ajax.getArrayBuffer;
    const xhr = getFn(url, fn);
    return function abort () { xhr.abort(); };
}

function cacheOnly(params, fn) {
    let aborted = false;
    fromCache(params, done);
    return function abort() { aborted = true; };
    function done(err, data) {
        if (!aborted) {
            return fn(err, data);
        }
    }
}

function networkFirst(params, fn) {
    return first([networkOnly, cacheOnly], params, fn);
}

function cacheFirst(params, fn) {
    return first([cacheOnly, networkOnly], params, fn);
}

function networkThenCache(params, fn) {
    return networkOnly(params, cacheOnSuccessFn(params, fn));
}

function cacheFirstThenCache(params, fn) {
    return cacheFirst(params, cacheOnSuccessFn(params, fn));
}

function keyFromParams({ coord, zoom, fontstack, range, url, _ilk }) {
    if (_ilk === 'json') {
        return {
            put: tileCache.putJson,
            get: tileCache.getJson,
            key: url
        };
    }
    if (_ilk === 'image') {
        return {
            put: tileCache.putImage,
            get: tileCache.getImage,
            key: url
        };
    }
    return fontstack ? {
        put: tileCache.putFont,
        get: tileCache.getFont,
        key: [ fontstack, range ]
    } : {
        put: tileCache.putTile,
        get: tileCache.getTile,
        key: [ coord.x, coord.y, zoom ]
    };
}

function cacheOnSuccessFn(params, fn) {
    return function(err, response) {
        fn(err, response);
        if (!err && response) {
            updateCache(params, response);
        }
    };
}

function fromCache(params, fn) {
    const { key, get } = keyFromParams(params);
    get(key, done);
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

function updateCache(params, response, fn = noop) {
    if (response._cacheHit) {
        return fn();
    }
    const { key, put } = keyFromParams(params);
    put(key, response.data, fn);
}

function first(tasks, params, fn) {
    let abortFn;

    function doTask(task, next, done) {
        abortFn = task(params, (err, data) => {
            if (err || !data) {
                return next();
            }
            done(err, data);
        });
    }

    function nextTask(i) {
        doTask(tasks[i], next, fn);
        function next() {
            if (++i < tasks.length) {
                nextTask(i);
            }
        }
    }

    nextTask(0);
    return function abort() {
        if (abortFn) { abortFn(); }
    };
}

function noop() {}
