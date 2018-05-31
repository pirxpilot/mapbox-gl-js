'use strict';

const window = require('../window');
const mapboxgl = require('../../');


module.exports = function () {
    return (new window.Worker(mapboxgl.workerUrl));
};
