'use strict';

const browser = require('../../util/browser');

module.exports = inertia;

const INERTIA_CUTOFF = 160; // msec
const EMPTY = { empty: true };
const MAX_LEN = 1000;
const MIN_REMOVE = Math.floor(MAX_LEN / 2);

function inertia(map, calculateInertia) {
  const states = [];

  function update(value) {
    const now = browser.now();
    const data = { time: now, value };
    const len = states.push(data);
    if (len > MAX_LEN) {
      let first = getFirst(now);
      if (first < 0) {
        first = len - 1;
      } else if (first < MIN_REMOVE) {
        first = MIN_REMOVE;
      }
      states.splice(0, first);
    }
  }

  function getFirst(now = browser.now()) {
    return states.findIndex(item => now - item.time < INERTIA_CUTOFF);
  }

  function calculate() {
    const first = getFirst();
    const last = states.length - 1;
    if (first < 0 || first >= last) {
      return EMPTY;
    }
    return calculateInertia(states[first], states[last]);
  }

  return {
    update,
    calculate
  };
}
