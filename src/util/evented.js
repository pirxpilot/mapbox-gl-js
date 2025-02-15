function _addEventListener(type, listener, listenerList) {
  const listenerExists = listenerList[type] && listenerList[type].indexOf(listener) !== -1;
  if (!listenerExists) {
    listenerList[type] = listenerList[type] || [];
    listenerList[type].push(listener);
  }
}

function _removeEventListener(type, listener, listenerList) {
  if (listenerList?.[type]) {
    const index = listenerList[type].indexOf(listener);
    if (index !== -1) {
      listenerList[type].splice(index, 1);
    }
  }
}

class Event {
  constructor(type, data = {}) {
    Object.assign(this, data);
    this.type = type;
  }
}

class ErrorEvent extends Event {
  constructor(error, data = {}) {
    super('error', Object.assign({ error }, data));
  }
}

/**
 * Methods mixed in to other classes for event capabilities.
 *
 * @mixin Evented
 */
class Evented {
  /**
   * Adds a listener to a specified event type.
   *
   * @param {string} type The event type to add a listen for.
   * @param {Function} listener The function to be called when the event is fired.
   *   The listener function is called with the data object passed to `fire`,
   *   extended with `target` and `type` properties.
   * @returns {Object} `this`
   */
  on(type, listener) {
    this._listeners = this._listeners || {};
    _addEventListener(type, listener, this._listeners);

    return this;
  }

  /**
   * Removes a previously registered event listener.
   *
   * @param {string} type The event type to remove listeners for.
   * @param {Function} listener The listener function to remove.
   * @returns {Object} `this`
   */
  off(type, listener) {
    _removeEventListener(type, listener, this._listeners);
    _removeEventListener(type, listener, this._oneTimeListeners);

    return this;
  }

  /**
   * Adds a listener that will be called only once to a specified event type.
   *
   * The listener will be called first time the event fires after the listener is registered.
   *
   * @param {string} type The event type to listen for.
   * @param {Function} listener The function to be called when the event is fired the first time.
   * @returns {Object} `this`
   */
  once(type, listener) {
    this._oneTimeListeners = this._oneTimeListeners || {};
    _addEventListener(type, listener, this._oneTimeListeners);

    return this;
  }

  fire(event) {
    // Compatibility with (type: string, properties: Object) signature from previous versions.
    // See https://github.com/mapbox/mapbox-gl-js/issues/6522,
    //     https://github.com/mapbox/mapbox-gl-draw/issues/766
    if (typeof event === 'string') {
      event = new Event(event, arguments[1] || {});
    }

    const type = event.type;

    if (this.listens(type)) {
      event.target = this;

      // make sure adding or removing listeners inside other listeners won't cause an infinite loop
      const listeners = this._listeners?.[type] ? this._listeners[type].slice() : [];
      for (const listener of listeners) {
        listener.call(this, event);
      }

      const oneTimeListeners = this._oneTimeListeners?.[type] ? this._oneTimeListeners[type].slice() : [];
      for (const listener of oneTimeListeners) {
        _removeEventListener(type, listener, this._oneTimeListeners);
        listener.call(this, event);
      }

      const parent = this._eventedParent;
      if (parent) {
        Object.assign(
          event,
          typeof this._eventedParentData === 'function' ? this._eventedParentData() : this._eventedParentData
        );
        parent.fire(event);
      }

      // To ensure that no error events are dropped, print them to the
      // console if they have no listeners.
    } else if (event instanceof ErrorEvent) {
      console.error(event.error);
    }

    return this;
  }

  /**
   * Returns a true if this instance of Evented or any forwardeed instances of Evented have a listener for the specified type.
   *
   * @param {string} type The event type
   * @returns {boolean} `true` if there is at least one registered listener for specified event type, `false` otherwise
   * @private
   */
  listens(type) {
    return (
      (this._listeners?.[type] && this._listeners[type].length > 0) ||
      (this._oneTimeListeners?.[type] && this._oneTimeListeners[type].length > 0) ||
      this._eventedParent?.listens(type)
    );
  }

  /**
   * Bubble all events fired by this instance of Evented to this parent instance of Evented.
   *
   * @private
   * @returns {Object} `this`
   * @private
   */
  setEventedParent(parent, data) {
    this._eventedParent = parent;
    this._eventedParentData = data;

    return this;
  }
}

module.exports = {
  Event,
  ErrorEvent,
  Evented
};
