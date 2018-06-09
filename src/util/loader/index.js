'use strict';

const ajax = require('../ajax');
const cache = require('./cache');

module.exports = selectStrategy;

const strategies = {
    'network-only': networkOnly,
    'network-first': networkFirst,
    'cache-only': cacheOnly,
    'cache-first': cacheFirst,
    'network-then-cache': networkThenCache,
    'cache-first-then-cache': cacheFirstThenCache
};

function selectStrategy(strategy = 'network-only') {
    return strategies[strategy] || strategies['network-only'];
}

function networkOnly({ url, _ilk }, fn) {
    const getFn = _ilk === 'json' ? ajax.getJSON : ajax.getArrayBuffer;
    const xhr = getFn({ url }, fn);
    return function abort () { xhr.abort(); };
}

function cacheOnly(params, fn) {
    let aborted = false;
    cache.from(params, done);
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

function cacheOnSuccessFn(params, fn) {
    return function(err, response) {
        fn(err, response);
        if (!err && response) {
            cache.update(params, response);
        }
    };
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
