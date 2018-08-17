'use strict';

const browser = require('../../util/browser');

module.exports = inertia;

const INERTIA_CUTOFF = 160; // msec

function inertia(map, calculateInertia) {
    let first, last;

    function update(value) {
        const now = browser.now();
        const data = { time: now, value };
        if (!first) {
            first = data;
            return;
        }
        if (last && now - last.time > INERTIA_CUTOFF) {
            first = data;
            last = undefined;
            return;
        }
        if (now - first.time > INERTIA_CUTOFF) {
            first = last;
        }
        last = data;
    }

    function isEmpty() {
        if (!first) {
            return true;
        }
        if (browser.now() - first.time > INERTIA_CUTOFF) {
            return true;
        }
        if (!last) {
            return true;
        }
    }

    function calculate() {
        return isEmpty() ? { empty: true } : calculateInertia(first, last);
    }

    return {
        update,
        calculate
    };
}

