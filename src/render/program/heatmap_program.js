"use strict";

const { mat4 } = require('@mapbox/gl-matrix');

const {
    Uniform1i,
    Uniform1f,
    Uniform2f,
    UniformMatrix4f
} = require('../uniform_binding');
const pixelsToTileUnits = require('../../source/pixels_to_tile_units');

const heatmapUniforms = (context, locations) => ({
    'u_extrude_scale': new Uniform1f(context, locations.u_extrude_scale),
    'u_intensity': new Uniform1f(context, locations.u_intensity),
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix)
});

const heatmapTextureUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_world': new Uniform2f(context, locations.u_world),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_color_ramp': new Uniform1i(context, locations.u_color_ramp),
    'u_opacity': new Uniform1f(context, locations.u_opacity)
});

const heatmapUniformValues = (
    matrix,
    tile,
    zoom,
    intensity
) => ({
    'u_matrix': matrix,
    'u_extrude_scale': pixelsToTileUnits(tile, 1, zoom),
    'u_intensity': intensity
});

const heatmapTextureUniformValues = (
    painter,
    layer,
    textureUnit,
    colorRampUnit
) => {
    const matrix = mat4.create();
    mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);

    const gl = painter.context.gl;

    return {
        'u_matrix': matrix,
        'u_world': [gl.drawingBufferWidth, gl.drawingBufferHeight],
        'u_image': textureUnit,
        'u_color_ramp': colorRampUnit,
        'u_opacity': layer.paint.get('heatmap-opacity')
    };
};

module.exports = {
    heatmapUniforms,
    heatmapTextureUniforms,
    heatmapUniformValues,
    heatmapTextureUniformValues
};
