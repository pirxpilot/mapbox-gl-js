"use strict";

const { patternUniformValues } = require('./pattern');
const {
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    Uniform3fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const {mat3, vec3, mat4} = require('@mapbox/gl-matrix');

const fillExtrusionUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_lightpos': new Uniform3fv(context),
    'u_lightintensity': new Uniform1f(context),
    'u_lightcolor': new Uniform3fv(context)
});

const fillExtrusionPatternUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_lightpos': new Uniform3fv(context),
    'u_lightintensity': new Uniform1f(context),
    'u_lightcolor': new Uniform3fv(context),
    'u_height_factor': new Uniform1f(context),
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

const extrusionTextureUniforms = (context) => new Uniforms({
    'u_matrix': new UniformMatrix4fv(context),
    'u_world': new Uniform2fv(context),
    'u_image': new Uniform1i(context),
    'u_opacity': new Uniform1f(context)
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
