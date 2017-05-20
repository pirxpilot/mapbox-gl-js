'use strict';

const Evented = require('./evented');

// @flow

type Config = {|
  API_URL: string,
  REQUIRE_ACCESS_TOKEN: boolean,
  ACCESS_TOKEN: ?string,
  LOADER_STRATEGY: ?string,
  TILE_LOADER_STRATEGY: ?string
|};

const config = Object.create(new Evented());

config.set = function set(c: Config) {
    Object.assign(config, c);
    config.fire('change', config);
};

config.set({
    API_URL: 'https://api.mapbox.com',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: null,
    LOADER_STRATEGY: 'network-only',
    TILE_LOADER_STRATEGY: 'network-only'
});

module.exports = config;
