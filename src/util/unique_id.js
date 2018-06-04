'use strict';

let id = 1;

/**
 * Return a unique numeric id, starting at 1 and incrementing with
 * each call.
 *
 * @returns unique numeric id.
 * @private
 */
module.exports = function uniqueId() {
    return id++;
};
