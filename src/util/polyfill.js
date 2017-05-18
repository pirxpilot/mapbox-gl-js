'use strict';

module.exports = loadPolyfills;

function loadPolyfills(self) {
    if (!detect()) {
        const features = [
            'Object.assign',
            'String.prototype.endsWith',
            'String.prototype.startsWith'
        ].join(',');
        self.importScripts(`https://cdn.polyfill.io/v2/polyfill.min.js?features=${features}`);
    }
}

function detect() {
    return 'assign' in Object &&
        'endsWith' in String.prototype &&
        'startsWith' in String.prototype;
}
