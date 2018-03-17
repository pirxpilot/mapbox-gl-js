"use strict";

const assert = require('assert');
const Color = require('../style-spec/util/color');

class Uniform {
    constructor(context, location) {
        this.context = context;
        this.location = location;
    }
}

class Uniform1i extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = 0;
    }

    set(v) {
        if (this.current !== v) {
            this.current = v;
            this.context.gl.uniform1i(this.location, v);
        }
    }
}

class Uniform1f extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = 0;
    }

    set(v) {
        if (this.current !== v) {
            this.current = v;
            this.context.gl.uniform1f(this.location, v);
        }
    }
}

class Uniform2fv extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = [0, 0];
    }

    set(v) {
        if (v[0] !== this.current[0] || v[1] !== this.current[1]) {
            this.current = v;
            this.context.gl.uniform2f(this.location, v[0], v[1]);
        }
    }
}

class Uniform3fv extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = [0, 0, 0];
    }

    set(v) {
        if (v[0] !== this.current[0] || v[1] !== this.current[1] || v[2] !== this.current[2]) {
            this.current = v;
            this.context.gl.uniform3f(this.location, v[0], v[1], v[2]);
        }
    }
}

class Uniform4fv extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = [0, 0, 0, 0];
    }

    set(v) {
        if (v[0] !== this.current[0] || v[1] !== this.current[1] ||
            v[2] !== this.current[2] || v[3] !== this.current[3]) {
            this.current = v;
            this.context.gl.uniform4f(this.location, v[0], v[1], v[2], v[3]);
        }
    }
}

class UniformColor extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = new Color(0, 0, 0, 0);
    }

    set(v) {
        if (v.r !== this.current.r || v.g !== this.current.g ||
            v.b !== this.current.b || v.a !== this.current.a) {
            this.current = v;
            this.context.gl.uniform4f(this.location, v.r, v.g, v.b, v.a);
        }
    }
}

class UniformMatrix4fv extends Uniform {
    constructor(context, location) {
        super(context, location);
        this.current = new Float32Array(16);
    }

    set(v) {
        for (let i = 0; i < 16; i++) {
            if (v[i] !== this.current[i]) {
                this.current = v;
                this.context.gl.uniformMatrix4fv(this.location, false, v);
                break;
            }
        }
    }
}

class Uniforms {

    constructor(bindings) {
        this.bindings = bindings;
    }

    set(uniformValues) {
        for (const name in uniformValues) {
            assert(this.bindings[name], `No binding with name ${name}`);
            this.bindings[name].set(uniformValues[name]);
        }
    }
}

module.exports = {
    Uniform,
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    Uniform3fv,
    Uniform4fv,
    UniformColor,
    UniformMatrix4fv,
    Uniforms
};
