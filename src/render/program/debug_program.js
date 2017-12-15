"use strict";

const {
    Uniform4fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const debugUniforms = (context) => new Uniforms({
    'u_color': new Uniform4fv(context),
    'u_matrix': new UniformMatrix4fv(context)
});

const debugUniformValues = (matrix, color) => ({
    'u_matrix': matrix,
    'u_color': [color.r, color.g, color.b, color.a]
});

module.exports = { debugUniforms, debugUniformValues };
