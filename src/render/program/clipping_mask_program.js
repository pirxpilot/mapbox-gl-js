"use strict";

const { UniformMatrix4fv } = require('../uniform_binding');

const clippingMaskUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4fv(context, locations.u_matrix)
});

const clippingMaskUniformValues = (matrix) => ({
    'u_matrix': matrix
});

module.exports = { clippingMaskUniforms, clippingMaskUniformValues };
