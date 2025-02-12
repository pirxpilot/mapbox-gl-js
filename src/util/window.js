'use strict';

const jsdom = require('jsdom');

const gl = require('gl');
const sinon = require('sinon');


const _window = create();

module.exports = _window;

function create() {
    // Create new window and inject into exported object
    const { window } = new jsdom.JSDOM('', {
        url: "https://example.org/",
        // Send jsdom console output to the node console object.
        virtualConsole: new jsdom.VirtualConsole().sendTo(console)
    });

    window.devicePixelRatio = 1;

    window.requestAnimationFrame = function (callback) {
        return setImmediate(callback, 0);
    };
    window.cancelAnimationFrame = clearImmediate;

    // Add webgl context with the supplied GL
    const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        if (type === 'webgl') {
            if (!this._webGLContext) {
                this._webGLContext = gl(this.width, this.height, attributes);
            }
            return this._webGLContext;
        }
        // Fallback to existing HTMLCanvasElement getContext behaviour
        return originalGetContext.call(this, type, attributes);
    };

    window.useFakeHTMLCanvasGetContext = function () {
        this.HTMLCanvasElement.prototype.getContext = function () { return '2d'; };
    };

    window.Blob = Blob
    window.URL.createObjectURL ??= URL.createObjectURL;
    window.URL.revokeObjectURL ??= URL.revokeObjectURL;

    window.ImageData ??= function () { return false; };
    window.ImageBitmap ??= function () { return false; };
    window.WebGLFramebuffer ??= Object;

    window.restore = restore;
    return window;
}

function restore() {
    // TODO: implement window restore
    // Remove previous window from exported object
    // const previousWindow = _window;
    // if (previousWindow.close) previousWindow.close();

    return _window;
}
