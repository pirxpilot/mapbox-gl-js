"use strict";

const { patternUniformValues } = require('./pattern');
const {
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    Uniform4fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const backgroundUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_opacity': new Uniform1f(context),
    'u_color': new Uniform4fv(context)
});

const backgroundPatternUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_opacity': new Uniform1f(context),
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

const backgroundUniformValues = (
    matrix,
    opacity,
    color
) => ({
    'u_matrix': matrix,
    'u_opacity': opacity,
    'u_color': [color.r, color.g, color.b, color.a]
});

const backgroundPatternUniformValues = (
    matrix,
    opacity,
    painter,
    image,
    tile
) => Object.assign(
    patternUniformValues(image, painter, tile),
    {
        'u_matrix': matrix,
        'u_opacity': opacity
    }
);

module.exports = {
    backgroundUniforms,
    backgroundPatternUniforms,
    backgroundUniformValues,
    backgroundPatternUniformValues
};
