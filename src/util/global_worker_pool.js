'use strict';

const workerPool = require('./worker_pool');

let globalWorkerPool;

/**
 * Creates (if necessary) and returns the single, global WorkerPool instance
 * to be shared across each Map
 * @private
 */
module.exports = function getGlobalWorkerPool() {
  if (!globalWorkerPool) {
    globalWorkerPool = workerPool();
  }
  return globalWorkerPool;
};
