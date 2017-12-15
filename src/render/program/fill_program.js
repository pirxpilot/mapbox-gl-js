"use strict";

const {patternUniformValues} = require('./pattern');
const {
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const fillUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context)
});

const fillPatternUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_image': new Uniform1i(context),
    'u_pattern_tl_a': new Uniform2fv(context),
    'u_pattern_br_a': new Uniform2fv(context),
    'u_pattern_tl_b': new Uniform2fv(context),
    'u_pattern_br_b': new Uniform2fv(context),
    'u_texsize': new Uniform2fv(context),
    'u_mix': new Uniform1f(context),
    'u_pattern_size_a': new Uniform2fv(context),
    'u_pattern_size_b': new Uniform2fv(context),
    'u_scale_a': new Uniform1f(context),
    'u_scale_b': new Uniform1f(context),
    'u_pixel_coord_upper': new Uniform2fv(context),
    'u_pixel_coord_lower': new Uniform2fv(context),
    'u_tile_units_to_pixels': new Uniform1f(context)
});

const fillOutlineUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_world': new Uniform2fv(context)
});

const fillOutlinePatternUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_world': new Uniform2fv(context),
    'u_image': new Uniform1i(context),
    'u_pattern_tl_a': new Uniform2fv(context),
    'u_pattern_br_a': new Uniform2fv(context),
    'u_pattern_tl_b': new Uniform2fv(context),
    'u_pattern_br_b': new Uniform2fv(context),
    'u_texsize': new Uniform2fv(context),
    'u_mix': new Uniform1f(context),
    'u_pattern_size_a': new Uniform2fv(context),
    'u_pattern_size_b': new Uniform2fv(context),
    'u_scale_a': new Uniform1f(context),
    'u_scale_b': new Uniform1f(context),
    'u_pixel_coord_upper': new Uniform2fv(context),
    'u_pixel_coord_lower': new Uniform2fv(context),
    'u_tile_units_to_pixels': new Uniform1f(context)
});

const fillUniformValues = (matrix) => ({
    'u_matrix': matrix
});

const fillPatternUniformValues = (
    matrix,
    painter,
    image,
    tile
) => Object.assign(
    fillUniformValues(matrix),
    patternUniformValues(image, painter, tile)
);

const fillOutlineUniformValues = (
    matrix,
    drawingBufferSize
) => ({
    'u_matrix': matrix,
    'u_world': drawingBufferSize
});

const fillOutlinePatternUniformValues = (
    matrix,
    painter,
    image,
    tile,
    drawingBufferSize
) => Object.assign(
    fillPatternUniformValues(matrix, painter, image, tile),
    {
        'u_world': drawingBufferSize
    }
);

module.exports = {
    fillUniforms,
    fillPatternUniforms,
    fillOutlineUniforms,
    fillOutlinePatternUniforms,
    fillUniformValues,
    fillPatternUniformValues,
    fillOutlineUniformValues,
    fillOutlinePatternUniformValues
};
