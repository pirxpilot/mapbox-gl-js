'use strict';

const ajax = require('../ajax');
const tileCache = require('tile-cache');

module.exports = selectStrategy;

const strategies = {
    'network-only': networkOnly,
    'network-first': networkFirst,
    'cache-only': cacheOnly,
    'cache-first': cacheFirst,
    'network-and-cache': networkAndCache
};

// 24 hours for cached tiles
const cacheControl = 'max-age:86400';

function selectStrategy(strategy) {
    if (!strategy) {
        strategy = 'network-only';
    }
    return strategies[strategy] || strategies['network-only'];
}

function networkOnly(params, fn) {
    const xhr = ajax.getArrayBuffer(params.url, fn);
    return function abort () { xhr.abort(); };
}

function cacheOnly(params, fn) {
    let aborted = false;
    tileCache.getTile(keyFromParams(params), done);
    return function abort() { aborted = true; };
    function done(err, data) {
        if (aborted) { return; }
        if (!err && !data) {
            err = new Error('Cache miss');
        }
        fn(err, data && { data, cacheControl });
    }
}

function networkFirst(params, fn) {
    return first([networkOnly, cacheOnly], params, fn);
}

function cacheFirst(params, fn) {
    return first([cacheOnly, networkOnly], params, fn);
}

function networkAndCache(params, fn) {
    const inProgress = networkOnly(params, done);
    return function abort() { inProgress.abort(); };
    function done(err, response) {
        fn(err, response);
        if (!err && response) {
            tileCache.putTile(keyFromParams(params), response.data, () => {});
        }
    }
}

function keyFromParams({ coord, zoom }) {
    return [ coord.x, coord.y, zoom ];
}

function first(tasks, params, fn) {
    let inProgress;

    function doTask(task, next, done) {
        inProgress = task(params, (err, data) => {
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
        if (inProgress) { inProgress.abort(); }
    };
}
