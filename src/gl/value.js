'use strict';

const Color = require('../style-spec/util/color');

const { clamp } = require('../util/util');

class ClearColor {

    constructor(context) {
        this.context = context;
        this.current = Color.transparent;
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v.r !== c.r || v.g !== c.g || v.b !== c.b || v.a !== c.a) {
            this.context.gl.clearColor(v.r, v.g, v.b, v.a);
            this.current = v;
        }
    }
}

class ClearDepth {

    constructor(context) {
        this.context = context;
        this.current = 1;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.clearDepth(v);
            this.current = v;
        }
    }
}

class ClearStencil {

    constructor(context) {
        this.context = context;
        this.current = 0;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.clearStencil(v);
            this.current = v;
        }
    }
}

class ColorMask {

    constructor(context) {
        this.context = context;
        this.current = [true, true, true, true];
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v[0] !== c[0] || v[1] !== c[1] || v[2] !== c[2] || v[3] !== c[3]) {
            this.context.gl.colorMask(v[0], v[1], v[2], v[3]);
            this.current = v;
        }
    }
}

class DepthMask {

    constructor(context) {
        this.context = context;
        this.current = true;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.depthMask(v);
            this.current = v;
        }
    }
}

class StencilMask {

    constructor(context) {
        this.context = context;
        this.current = 0xFF;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.stencilMask(v);
            this.current = v;
        }
    }
}

class StencilFunc {

    constructor(context) {
        this.context = context;
        this.current = {
            func: context.gl.ALWAYS,
            ref: 0,
            mask: 0xFF
        };
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v.func !== c.func || v.ref !== c.ref || v.mask !== c.mask) {
            this.context.gl.stencilFunc(v.func, v.ref, v.mask);
            this.current = v;
        }
    }
}

class StencilOp {

    constructor(context) {
        this.context = context;
        const gl = this.context.gl;
        this.current = [gl.KEEP, gl.KEEP, gl.KEEP];
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v[0] !== c[0] || v[1] !== c[1] || v[2] !== c[2]) {
            this.context.gl.stencilOp(v[0], v[1], v[2]);
            this.current = v;
        }
    }
}

class StencilTest {

    constructor(context) {
        this.context = context;
        this.current = false;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            if (v) {
                gl.enable(gl.STENCIL_TEST);
            } else {
                gl.disable(gl.STENCIL_TEST);
            }
            this.current = v;
        }
    }
}

class DepthRange {

    constructor(context) {
        this.context = context;
        this.current = [0, 1];
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v[0] !== c[0] || v[1] !== c[1]) {
            this.context.gl.depthRange(v[0], v[1]);
            this.current = v;
        }
    }
}

class DepthTest {

    constructor(context) {
        this.context = context;
        this.current = false;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            if (v) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
            this.current = v;
        }
    }
}

class DepthFunc {

    constructor(context) {
        this.context = context;
        this.current = context.gl.LESS;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.depthFunc(v);
            this.current = v;
        }
    }
}

class Blend {

    constructor(context) {
        this.context = context;
        this.current = false;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            if (v) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }
            this.current = v;
        }
    }
}

class BlendFunc {

    constructor(context) {
        this.context = context;
        const gl = this.context.gl;
        this.current = [gl.ONE, gl.ZERO];
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v[0] !== c[0] || v[1] !== c[1]) {
            this.context.gl.blendFunc(v[0], v[1]);
            this.current = v;
        }
    }
}

class BlendColor {

    constructor(context) {
        this.context = context;
        this.current = Color.transparent;
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v.r !== c.r || v.g !== c.g || v.b !== c.b || v.a !== c.a) {
            this.context.gl.blendColor(v.r, v.g, v.b, v.a);
            this.current = v;
        }
    }
}

class Program {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.useProgram(v);
            this.current = v;
        }
    }
}

class LineWidth {

    constructor(context) {
        this.context = context;
        this.current = 1;
    }

    get() { return this.current; }

    set(v) {
        const range = this.context.lineWidthRange;
        const clamped = clamp(v, range[0], range[1]);
        if (this.current !== clamped) {
            this.context.gl.lineWidth(clamped);
            this.current = v;
        }
    }
}

class ActiveTextureUnit {

    constructor(context) {
        this.context = context;
        this.current = context.gl.TEXTURE0;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            this.context.gl.activeTexture(v);
            this.current = v;
        }
    }
}

class Viewport {

    constructor(context) {
        this.context = context;
        const gl = this.context.gl;
        this.current = [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight];
    }

    get() { return this.current; }

    set(v) {
        const c = this.current;
        if (v[0] !== c[0] || v[1] !== c[1] || v[2] !== c[2] || v[3] !== c[3]) {
            this.context.gl.viewport(v[0], v[1], v[2], v[3]);
            this.current = v;
        }
    }
}

class BindFramebuffer {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, v);
            this.current = v;
        }
    }
}

class BindRenderbuffer {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.bindRenderbuffer(gl.RENDERBUFFER, v);
            this.current = v;
        }
    }
}

class BindTexture {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.bindTexture(gl.TEXTURE_2D, v);
            this.current = v;
        }
    }
}

class BindVertexBuffer {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            this.current = v;
        }
    }
}

class BindElementBuffer {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        // Always rebind
        const gl = this.context.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, v);
        this.current = v;
    }
}

class BindVertexArrayOES {

    constructor(context) {
        this.context = context;
        this.current = null;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v && this.context.extVertexArrayObject) {
            this.context.extVertexArrayObject.bindVertexArrayOES(v);
            this.current = v;
        }
    }
}

class PixelStoreUnpack {

    constructor(context) {
        this.context = context;
        this.current = 4;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, v);
            this.current = v;
        }
    }
}

class PixelStoreUnpackPremultiplyAlpha {

    constructor(context) {
        this.context = context;
        this.current = false;
    }

    get() { return this.current; }

    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, (v));
            this.current = v;
        }
    }
}

/**
 * Framebuffer values
 * @private
 */
class FramebufferValue {

    constructor(context, parent) {
        this.context = context;
        this.current = null;
        this.parent = parent;
    }

    get() { return this.current; }
}

class ColorAttachment extends FramebufferValue {

    constructor(context, parent) {
        super(context, parent);
        this.dirty = false;
    }

    set(v) {
        if (this.dirty || this.current !== v) {
            const gl = this.context.gl;
            this.context.bindFramebuffer.set(this.parent);
            // note: it's possible to attach a renderbuffer to the color
            // attachment point, but thus far MBGL only uses textures for color
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, v, 0);
            this.current = v;
            this.dirty = false;
        }
    }

    setDirty() {
        this.dirty = true;
    }
}

class DepthAttachment extends FramebufferValue {
    set(v) {
        if (this.current !== v) {
            const gl = this.context.gl;
            this.context.bindFramebuffer.set(this.parent);
            // note: it's possible to attach a texture to the depth attachment
            // point, but thus far MBGL only uses renderbuffers for depth
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, v);
            this.current = v;
        }
    }
}

module.exports = {
    ClearColor,
    ClearDepth,
    ClearStencil,
    ColorMask,
    DepthMask,
    StencilMask,
    StencilFunc,
    StencilOp,
    StencilTest,
    DepthRange,
    DepthTest,
    DepthFunc,
    Blend,
    BlendFunc,
    BlendColor,
    Program,
    LineWidth,
    ActiveTextureUnit,
    Viewport,
    BindFramebuffer,
    BindRenderbuffer,
    BindTexture,
    BindVertexBuffer,
    BindElementBuffer,
    BindVertexArrayOES,
    PixelStoreUnpack,
    PixelStoreUnpackPremultiplyAlpha,
    FramebufferValue,
    ColorAttachment,
    DepthAttachment
};
