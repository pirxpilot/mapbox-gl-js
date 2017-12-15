"use strict";

const {
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');

const symbolIconUniforms = context => new Uniforms({
    'u_is_size_zoom_constant': new Uniform1i(context),
    'u_is_size_feature_constant': new Uniform1i(context),
    'u_size_t': new Uniform1f(context),
    'u_size': new Uniform1f(context),
    'u_camera_to_center_distance': new Uniform1f(context),
    'u_pitch': new Uniform1f(context),
    'u_rotate_symbol': new Uniform1i(context),
    'u_aspect_ratio': new Uniform1f(context),
    'u_fade_change': new Uniform1f(context),
    'u_matrix': new UniformMatrix4fv(context),
    'u_label_plane_matrix': new UniformMatrix4fv(context),
    'u_gl_coord_matrix': new UniformMatrix4fv(context),
    'u_is_text': new Uniform1f(context),
    'u_pitch_with_map': new Uniform1i(context),
    'u_texsize': new Uniform2fv(context),
    'u_texture': new Uniform1i(context)
});

const symbolSDFUniforms = context => new Uniforms({
    'u_is_size_zoom_constant': new Uniform1i(context),
    'u_is_size_feature_constant': new Uniform1i(context),
    'u_size_t': new Uniform1f(context),
    'u_size': new Uniform1f(context),
    'u_camera_to_center_distance': new Uniform1f(context),
    'u_pitch': new Uniform1f(context),
    'u_rotate_symbol': new Uniform1i(context),
    'u_aspect_ratio': new Uniform1f(context),
    'u_fade_change': new Uniform1f(context),
    'u_matrix': new UniformMatrix4fv(context),
    'u_label_plane_matrix': new UniformMatrix4fv(context),
    'u_gl_coord_matrix': new UniformMatrix4fv(context),
    'u_is_text': new Uniform1f(context),
    'u_pitch_with_map': new Uniform1i(context),
    'u_texsize': new Uniform2fv(context),
    'u_texture': new Uniform1i(context),
    'u_gamma_scale': new Uniform1f(context),
    'u_is_halo': new Uniform1f(context)
});

const symbolIconUniformValues = (
    functionType,
    size,
    rotateInShader,
    pitchWithMap,
    painter,
    matrix,
    labelPlaneMatrix,
    glCoordMatrix,
    isText,
    texSize
) => {
    const { transform } = painter;

    return {
        'u_is_size_zoom_constant': +(functionType === 'constant' || functionType === 'source'),
        'u_is_size_feature_constant': +(functionType === 'constant' || functionType === 'camera'),
        'u_size_t': size ? size.uSizeT : 0,
        'u_size': size ? size.uSize : 0,
        'u_camera_to_center_distance': transform.cameraToCenterDistance,
        'u_pitch': transform.pitch / 360 * 2 * Math.PI,
        'u_rotate_symbol': +rotateInShader,
        'u_aspect_ratio': transform.width / transform.height,
        'u_fade_change': painter.options.fadeDuration ? painter.symbolFadeChange : 1,
        'u_matrix': matrix,
        'u_label_plane_matrix': labelPlaneMatrix,
        'u_gl_coord_matrix': glCoordMatrix,
        'u_is_text': +isText,
        'u_pitch_with_map': +pitchWithMap,
        'u_texsize': texSize,
        'u_texture': 0
    };
};

const symbolSDFUniformValues = (
    functionType,
    size,
    rotateInShader,
    pitchWithMap,
    painter,
    matrix,
    labelPlaneMatrix,
    glCoordMatrix,
    isText,
    texSize,
    isHalo
) => {
    const { transform } = painter;

    return Object.assign(
        symbolIconUniformValues(
            functionType,
            size,
            rotateInShader,
            pitchWithMap,
            painter,
            matrix,
            labelPlaneMatrix,
            glCoordMatrix,
            isText,
            texSize
        ), {
            'u_gamma_scale': (pitchWithMap ? Math.cos(transform._pitch) * transform.cameraToCenterDistance : 1),
            'u_is_halo': +isHalo
        }
    );
};

module.exports = { symbolIconUniforms, symbolSDFUniforms, symbolIconUniformValues, symbolSDFUniformValues };
