'use strict';

const async = require('./async');
const uniqueId = require('./unique_id');
const actor = require('./actor');

module.exports = dispatcher;

const noop = () => {};

/**
 * Responsible for sending messages from a {@link Source} to an associated
 * {@link WorkerSource}.
 *
 * @private
 */
function dispatcher(workerPool, parent, makeActor = actor) {
  // exposed to allow stubbing in unit tests

  let currentActor = 0;
  const id = uniqueId();
  const workers = workerPool.acquire(id);
  const actors = workers.map((worker, i) => makeActor(worker, parent, id, `Worker ${i}`));

  /**
   * Broadcast a message to all Workers.
   */
  function broadcast(type, data, cb = noop) {
    async.all(actors, (actor, done) => actor.send(type, data, done), cb);
  }

  // Use round robin to send requests to web workers.
  function nextActorId() {
    currentActor += 1;
    if (currentActor === actors.length) {
      currentActor = 0;
    }
    return currentActor;
  }

  /**
   * Send a message to a Worker.
   * @param targetID The ID of the Worker to which to send this message. Omit to allow the dispatcher to choose.
   * @returns The ID of the worker to which the message was sent.
   */
  function send(type, data, callback, targetID) {
    if (typeof targetID !== 'number' || isNaN(targetID)) {
      targetID = nextActorId();
    }

    const actor = actors[targetID];
    if (actor) {
      actor.send(type, data, callback);
    }
    return targetID;
  }

  function remove() {
    actors.forEach(actor => actor.remove());
    actors.length = 0;
    workerPool.release(id);
  }

  return {
    id,
    broadcast,
    send,
    remove
  };
}
