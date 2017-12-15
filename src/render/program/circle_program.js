"use strict";

const {
    Uniform1i,
    Uniform1f,
    Uniform2fv,
    UniformMatrix4fv,
    Uniforms
} = require('../uniform_binding');
const pixelsToTileUnits = require('../../source/pixels_to_tile_units');

const circleUniforms = (context) => new Uniforms({
    'u_camera_to_center_distance': new Uniform1f(context),
    'u_scale_with_map': new Uniform1i(context),
    'u_pitch_with_map': new Uniform1i(context),
    'u_extrude_scale': new Uniform2fv(context),
    'u_matrix': new UniformMatrix4fv(context)
});

const circleUniformValues = (
    painter,
    coord,
    tile,
    layer
) => {
    const transform = painter.transform;

    let pitchWithMap, extrudeScale;
    if (layer.paint.get('circle-pitch-alignment') === 'map') {
        const pixelRatio = pixelsToTileUnits(tile, 1, transform.zoom);
        pitchWithMap = true;
        extrudeScale = [pixelRatio, pixelRatio];
    } else {
        pitchWithMap = false;
        extrudeScale = transform.pixelsToGLUnits;
    }

    return {
        'u_camera_to_center_distance': transform.cameraToCenterDistance,
        'u_scale_with_map': +(layer.paint.get('circle-pitch-scale') === 'map'),
        'u_matrix': painter.translatePosMatrix(
            coord.posMatrix,
            tile,
            layer.paint.get('circle-translate'),
            layer.paint.get('circle-translate-anchor')),
        'u_pitch_with_map': +(pitchWithMap),
        'u_extrude_scale': extrudeScale
    };
};

module.exports = { circleUniforms, circleUniformValues };
