'use strict';

const { Evented } = require('./evented');

const config = new Evented();

config.set = function set(c) {
    Object.assign(config, c);
    config.fire('change', config);
};

config.set({
    API_URL: 'https://api.mapbox.com',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: null,
    LOADER_STRATEGY: 'network-only'
});

module.exports = config;
