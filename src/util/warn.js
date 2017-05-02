'use strict';

/**
 * Print a warning message to the console and ensure duplicate warning messages
 * are not printed.
 *
 * @private
 */
const warnOnceHistory = {};

function once(message) {
    if (!warnOnceHistory[message]) {
        console.warn(message);
        warnOnceHistory[message] = true;
    }
}

function noop() {}

// console isn't defined in some WebWorkers, see #2558
module.exports = {
    once: typeof console !== "undefined" ? once : noop
};
