"use strict";

const { patternUniformValues } = require('./pattern');
const {
    Uniform1i,
    Uniform1f,
    Uniform2f,
    Uniform3f,
    UniformMatrix4f
} = require('../uniform_binding');

const {mat3, vec3, mat4} = require('@mapbox/gl-matrix');

const fillExtrusionUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_lightpos': new Uniform3f(context, locations.u_lightpos),
    'u_lightintensity': new Uniform1f(context, locations.u_lightintensity),
    'u_lightcolor': new Uniform3f(context, locations.u_lightcolor)
});

const fillExtrusionPatternUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_lightpos': new Uniform3f(context, locations.u_lightpos),
    'u_lightintensity': new Uniform1f(context, locations.u_lightintensity),
    'u_lightcolor': new Uniform3f(context, locations.u_lightcolor),
    'u_height_factor': new Uniform1f(context, locations.u_height_factor),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_pattern_tl_a': new Uniform2f(context, locations.u_pattern_tl_a),
    'u_pattern_br_a': new Uniform2f(context, locations.u_pattern_br_a),
    'u_pattern_tl_b': new Uniform2f(context, locations.u_pattern_tl_b),
    'u_pattern_br_b': new Uniform2f(context, locations.u_pattern_br_b),
    'u_texsize': new Uniform2f(context, locations.u_texsize),
    'u_mix': new Uniform1f(context, locations.u_mix),
    'u_pattern_size_a': new Uniform2f(context, locations.u_pattern_size_a),
    'u_pattern_size_b': new Uniform2f(context, locations.u_pattern_size_b),
    'u_scale_a': new Uniform1f(context, locations.u_scale_a),
    'u_scale_b': new Uniform1f(context, locations.u_scale_b),
    'u_pixel_coord_upper': new Uniform2f(context, locations.u_pixel_coord_upper),
    'u_pixel_coord_lower': new Uniform2f(context, locations.u_pixel_coord_lower),
    'u_tile_units_to_pixels': new Uniform1f(context, locations.u_tile_units_to_pixels)
});

const extrusionTextureUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_world': new Uniform2f(context, locations.u_world),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_opacity': new Uniform1f(context, locations.u_opacity)
});

const fillExtrusionUniformValues = (
    matrix,
    painter
) => {
    const light = painter.style.light;
    const _lp = light.properties.get('position');
    const lightPos = [_lp.x, _lp.y, _lp.z];
    const lightMat = mat3.create();
    if (light.properties.get('anchor') === 'viewport') {
        mat3.fromRotation(lightMat, -painter.transform.angle);
    }
    vec3.transformMat3(lightPos, lightPos, lightMat);

    const lightColor = light.properties.get('color');

    return {
        'u_matrix': matrix,
        'u_lightpos': lightPos,
        'u_lightintensity': light.properties.get('intensity'),
        'u_lightcolor': [lightColor.r, lightColor.g, lightColor.b]
    };
};

const fillExtrusionPatternUniformValues = (
    matrix,
    painter,
    coord,
    image,
    tile
) => {
    return Object.assign(fillExtrusionUniformValues(matrix, painter),
        patternUniformValues(image, painter, tile),
        {
            'u_height_factor': -Math.pow(2, coord.overscaledZ) / tile.tileSize / 8
        });
};

const extrusionTextureUniformValues = (
    painter,
    layer,
    textureUnit
) => {
    const matrix = mat4.create();
    mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);

    const gl = painter.context.gl;

    return {
        'u_matrix': matrix,
        'u_world': [gl.drawingBufferWidth, gl.drawingBufferHeight],
        'u_image': textureUnit,
        'u_opacity': layer.paint.get('fill-extrusion-opacity')
    };
};

module.exports = {
    fillExtrusionUniforms,
    fillExtrusionPatternUniforms,
    extrusionTextureUniforms,
    fillExtrusionUniformValues,
    fillExtrusionPatternUniformValues,
    extrusionTextureUniformValues
};
