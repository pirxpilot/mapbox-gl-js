'use strict';

function getDefaultWorkerCount() {
    const browser = require('./browser');
    return Math.max(Math.floor(browser.hardwareConcurrency / 2), 1);
}

const config = {
    API_URL: 'https://api.mapbox.com',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: null,
    WORKER_COUNT: getDefaultWorkerCount(),
    WORKER_URL: ''
};

module.exports = config;
