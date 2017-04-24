'use strict';

const { Evented } = require('./evented');

function getDefaultWorkerCount() {
    const browser = require('./browser');
    return Math.max(Math.floor(browser.hardwareConcurrency / 2), 1);
}

const config = new Evented();

config.set = function set(c) {
    Object.assign(config, c);
    config.fire('change', config);
};

config.set({
    API_URL: 'https://api.mapbox.com',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: null,
    WORKER_COUNT: getDefaultWorkerCount(),
    WORKER_URL: '',
    LOADER_STRATEGY: 'network-only',
    TILE_LOADER_STRATEGY: 'network-only'
});

module.exports = config;
