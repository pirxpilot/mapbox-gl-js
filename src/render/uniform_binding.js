"use strict";

const assert = require('assert');
const Color = require('../style-spec/util/color');

class Uniform {
    constructor(context) {
        this.context = context;
    }
}

class Uniform1i extends Uniform {
    set(location, v) {
        if (this.current !== v || this.location !== location) {
            this.current = v;
            this.location = location;
            this.context.gl.uniform1i(location, v);
        }
    }
}

class Uniform1f extends Uniform {
    set(location, v) {
        if (this.current !== v || this.location !== location) {
            this.current = v;
            this.location = location;
            this.context.gl.uniform1f(location, v);
        }
    }
}

class Uniform2fv extends Uniform {
    set(location, v) {
        const c = this.current;
        if (!c || v[0] !== c[0] || v[1] !== c[1] || this.location !== location) {
            this.current = v;
            this.location = location;
            this.context.gl.uniform2f(location, v[0], v[1]);
        }
    }
}

class Uniform3fv extends Uniform {
    set(location, v) {
        const c = this.current;
        if (!c || v[0] !== c[0] || v[1] !== c[1] || v[2] !== c[2] || this.location !== location) {
            this.current = v;
            this.location = location;
            this.context.gl.uniform3f(location, v[0], v[1], v[2]);
        }
    }
}

class Uniform4fv extends Uniform {
    set(location, v) {
        const c = this.current;
        if (v instanceof Color && (!c || c instanceof Color)) {
            if (!c || v.r !== c.r || v.g !== c.g || v.b !== c.b || v.a !== c.a || this.location !== location) {
                this.current = v;
                this.location = location;
                this.context.gl.uniform4f(location, v.r, v.g, v.b, v.a);
            }
        } else if (Array.isArray(v) && (!c || Array.isArray(c))) {
            if (!c || v[0] !== c[0] || v[1] !== c[1] || v[2] !== c[2] || v[3] !== c[3] || this.location !== location) {
                this.current = v;
                this.location = location;
                this.context.gl.uniform4f(location, v[0], v[1], v[2], v[3]);
            }
        }
    }
}

class UniformMatrix4fv extends Uniform {
    set(location, v) {
        let diff = !this.current || this.location !== location;

        if (!diff && this.current) {
            for (let i = 0; i < 16; i++) {
                if (v[i] !== this.current[i]) {
                    diff = true;
                    break;
                }
            }
        }

        if (diff) {
            this.current = v;
            this.location = location;
            this.context.gl.uniformMatrix4fv(location, false, v);
        }
    }
}

class Uniforms {

    constructor(bindings) {
        this.bindings = bindings;
    }

    set(uniformLocations, uniformValues) {
        for (const name in uniformValues) {
            assert(this.bindings[name], `No binding with name ${name}`);
            this.bindings[name].set(uniformLocations[name], uniformValues[name]);
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
    UniformMatrix4fv,
    Uniforms
};
