'use strict';

const window = require('../window');
const config = require('../config');



module.exports = function () {
    return new window.Worker(getWorkerUrl());
};

let workerUrl;

function getWorkerUrl() {
    if (!workerUrl) {
        const url = new window.URL(config.WORKER_URL, window.location.origin);
        const workerBlob = new Blob([`importScripts('${url}')`], { type: 'text/javascript' });
        workerUrl = window.URL.createObjectURL(workerBlob);
    }
    return workerUrl;
}
