'use strict';

const { serialize, deserialize } = require('./web_worker_transfer');

module.exports = actor;

/**
 * An implementation of the [Actor design pattern](http://en.wikipedia.org/wiki/Actor_model)
 * that maintains the relationship between asynchronous tasks and the objects
 * that spin them off - in this case, tasks like parsing parts of styles,
 * owned by the styles
 *
 * @param {WebWorker} target
 * @param {WebWorker} parent
 * @param {string|number} mapId A unique identifier for the Map instance using this Actor.
 * @private
 */

function actor(target, parent, mapId, name) {
  const callbacks = {};
  let callbackID = 0;
  target.addEventListener('message', receive, false);

  function postMessage(targetMapId, id, type, data, err) {
    const buffers = [];
    const payload = {
      targetMapId,
      sourceMapId: mapId,
      type,
      id,
      data: serialize(data, buffers)
    };
    if (err) {
      payload.error = serialize(err);
    }
    target.postMessage(payload, buffers);
  }

  /**
   * Sends a message from a main-thread map to a Worker or from a Worker back to
   * a main-thread map instance.
   *
   * @param type The name of the target method to invoke or '[source-type].[source-name].name' for a method on a WorkerSource.
   * @param targetMapId A particular mapId to which to send this message.
   * @private
   */
  function send(type, data, callback, targetMapId) {
    let id = 'null';
    if (callback) {
      id = `${mapId}:${callbackID++}`;
      callbacks[id] = callback;
    }
    postMessage(targetMapId, id, type, data);
  }

  function receive(message) {
    const { data } = message;
    const { id, type, targetMapId } = data;

    if (targetMapId && mapId !== targetMapId) return;

    const done = (err, data) => postMessage(undefined, id, '<response>', data, err);

    if (type === '<response>') {
      const callback = callbacks[id];
      delete callbacks[id];
      if (callback) {
        if (data.error) {
          callback(deserialize(data.error));
        } else {
          callback(null, deserialize(data.data));
        }
      }
      return;
    }

    if (typeof id !== 'undefined') {
      if (parent[type]) {
        // data.type == 'loadTile', 'removeTile', etc.
        parent[type](data.sourceMapId, deserialize(data.data), done);
        return;
      }
      if (parent.getWorkerSource) {
        // data.type == sourcetype.method
        const [sourcetype, method] = type.split('.');
        const params = deserialize(data.data);
        const workerSource = parent.getWorkerSource(data.sourceMapId, sourcetype, params.source);
        workerSource[method](params, done);
        return;
      }
    }

    parent[type](deserialize(data.data));
  }

  function remove() {
    target.removeEventListener('message', receive, false);
  }

  return {
    send,
    receive,
    remove,
    name
  };
}
