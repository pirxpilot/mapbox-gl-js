// 
import assert from 'assert';

 // can't mark opaque due to https://github.com/flowtype/flow-remove-types/pull/61

class TaskQueue {

    constructor()  {
        this._queue = [];
        this._id = 0;
        this._cleared = false;
        this._currentlyRunning = false;
    }

    add(callback) {
        const id = ++this._id;
        const queue = this._queue;
        queue.push({callback, id, cancelled: false});
        return id;
    }

    remove(id) {
        const running = this._currentlyRunning;
        const queue = running ? this._queue.concat(running) : this._queue;
        for (const task of queue) {
            if (task.id === id) {
                task.cancelled = true;
                return;
            }
        }
    }

    run() {
        assert(!this._currentlyRunning);
        const queue = this._currentlyRunning = this._queue;

        // Tasks queued by callbacks in the current queue should be executed
        // on the next run, not the current run.
        this._queue = [];

        for (const task of queue) {
            if (task.cancelled) continue;
            task.callback();
            if (this._cleared) break;
        }

        this._cleared = false;
        this._currentlyRunning = false;
    }

    clear() {
        if (this._currentlyRunning) {
            this._cleared = true;
        }
        this._queue = [];
    }
}

export default TaskQueue;
