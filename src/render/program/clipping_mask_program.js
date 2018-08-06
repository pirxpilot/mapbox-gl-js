"use strict";

const { UniformMatrix4f } = require('../uniform_binding');

const clippingMaskUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix)
});

const clippingMaskUniformValues = (matrix) => ({
    'u_matrix': matrix
});

module.exports = { clippingMaskUniforms, clippingMaskUniformValues };
