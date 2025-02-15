const assert = require('assert');
const WebWorker = require('./web_worker');
const config = require('./config');

module.exports = workerPool;

/**
 * Constructs a worker pool.
 * @private
 */
function workerPool(workerCount = config.WORKER_COUNT) {
  const active = {};
  let workers;

  function acquire(mapId) {
    if (!workers) {
      assert(typeof workerCount === 'number' && workerCount < Number.POSITIVE_INFINITY);

      workers = new Array(workerCount);
      for (let i = 0; i < workerCount; i++) {
        workers[i] = new WebWorker();
      }
    }

    active[mapId] = true;
    return workers.slice();
  }

  function release(mapId) {
    delete active[mapId];
    if (Object.keys(active).length === 0) {
      workers.forEach(w => w.terminate());
      workers = undefined;
    }
  }

  return {
    acquire,
    release
  };
}
