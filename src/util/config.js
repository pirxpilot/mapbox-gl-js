'use strict';

const { Evented } = require('./evented');

function getDefaultWorkerCount() {
  const browser = require('./browser');
  return Math.max(Math.floor(browser.hardwareConcurrency / 2), 1);
}

function getBaseUri() {
  const w = require('./window');
  return w.document.baseURI;
}

const config = new Evented();

config.set = function set(c) {
  Object.assign(config, c);
  config.notify();
};

config.notify = function () {
  config.fire('change', config);
};

config.set({
  BASE_URL: getBaseUri(),
  LOCALIZED_NAMES: true,
  WORKER_COUNT: getDefaultWorkerCount(),
  WORKER_URL: ''
});

module.exports = config;
