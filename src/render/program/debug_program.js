"use strict";

const {
    UniformColor,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const debugUniforms = (context, locations) => new Uniforms({
    'u_color': new UniformColor(context, locations.u_color),
    'u_matrix': new UniformMatrix4fv(context, locations.u_matrix)
});

const debugUniformValues = (matrix, color) => ({
    'u_matrix': matrix,
    'u_color': color
});

module.exports = { debugUniforms, debugUniformValues };
