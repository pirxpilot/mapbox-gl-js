'use strict';
// @flow

/**
 * Print a warning message to the console and ensure duplicate warning messages
 * are not printed.
 *
 * @private
 */
const warnOnceHistory: {[key: string]: boolean} = {};
exports.once = function(message: string): void {
    if (!warnOnceHistory[message]) {
        // console isn't defined in some WebWorkers, see #2558
        if (typeof console !== "undefined") console.warn(message);
        warnOnceHistory[message] = true;
    }
};
