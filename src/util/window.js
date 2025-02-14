const jsdom = require('jsdom');
const canvas = require('canvas');
const gl = require('gl');

const _window = create();

module.exports = _window;

function create() {
  // Create new window and inject into exported object
  const { window } = new jsdom.JSDOM('', {
    url: 'https://example.org/',
    // Send jsdom console output to the node console object.
    virtualConsole: new jsdom.VirtualConsole().sendTo(console),
    // load images
    resources: 'usable'
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

  window.Blob = Blob;
  window.URL.createObjectURL ??= obj => (obj?.type === 'image/png' ? createPngUrl(obj) : URL.createObjectURL(obj));
  window.URL.revokeObjectURL ??= URL.revokeObjectURL;

  window.ImageData ??=
    canvas.ImageData ??
    function () {
      return false;
    };
  window.ImageBitmap ??= function () {
    return false;
  };
  window.WebGLFramebuffer ??= Object;

  window.restore = restore;

  globalThis.document ??= window.document;

  return window;
}

async function createPngUrl(obj) {
  const png = await obj.bytes();
  const pngUrl = `data:${obj.type};base64,${Buffer.from(png).toString('base64')}`;
  return pngUrl;
}

function restore() {
  // TODO: implement window restore
  // Remove previous window from exported object
  // const previousWindow = _window;
  // if (previousWindow.close) previousWindow.close();

  return _window;
}
