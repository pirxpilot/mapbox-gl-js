"use strict";

const { UniformMatrix4fv, Uniforms } = require('../uniform_binding');

const clippingMaskUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context)
});

const clippingMaskUniformValues = (matrix) => ({
    'u_matrix': matrix
});

module.exports = { clippingMaskUniforms, clippingMaskUniformValues };
