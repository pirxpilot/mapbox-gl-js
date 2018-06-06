'use strict';

const window = require('../window');
const config = require('../config');

module.exports = function () {
    const { WORKER_URL: workerUrl } = config;
    return new window.Worker(workerUrl);
};
