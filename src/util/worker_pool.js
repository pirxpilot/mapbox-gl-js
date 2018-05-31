'use strict';

const assert = require('assert');

const WebWorker = require('./web_worker');

const mapboxgl = require('../');

/**
 * Constructs a worker pool.
 * @private
 */
class WorkerPool {

    constructor() {
        this.active = {};
    }

    acquire(mapId) {
        if (!this.workers) {
            // Lazily look up the value of mapboxgl.workerCount so that
            // client code has had a chance to set it.
            const workerCount = mapboxgl.workerCount;
            assert(typeof workerCount === 'number' && workerCount < Infinity);

            this.workers = [];
            while (this.workers.length < workerCount) {
                this.workers.push(new WebWorker());
            }
        }

        this.active[mapId] = true;
        return this.workers.slice();
    }

    release(mapId) {
        delete this.active[mapId];
        if (Object.keys(this.active).length === 0) {
            this.workers.forEach((w) => {
                w.terminate();
            });
            this.workers = (null);
        }
    }
}

module.exports = WorkerPool;
