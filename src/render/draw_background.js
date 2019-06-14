'use strict';

const StencilMode = require('../gl/stencil_mode');
const DepthMode = require('../gl/depth_mode');
const {
    backgroundUniformValues,
    backgroundPatternUniformValues
} = require('./program/background_program');


module.exports = drawBackground;

function drawBackground(painter, sourceCache, layer) {
    const color = layer.paint.get('background-color');
    const opacity = layer.paint.get('background-opacity');

    if (opacity === 0) return;

    const context = painter.context;
    const gl = context.gl;
    const transform = painter.transform;
    const tileSize = transform.tileSize;
    const image = layer.paint.get('background-pattern');
    if (painter.isPatternMissing(image)) return;

    const pass = (!image && color.a === 1 && opacity === 1) ? 'opaque' : 'translucent';
    if (painter.renderPass !== pass) return;

    const stencilMode = StencilMode.disabled;
    const depthMode = painter.depthModeForSublayer(0, pass === 'opaque' ? DepthMode.ReadWrite : DepthMode.ReadOnly);
    const colorMode = painter.colorModeForRenderPass();

    const program = painter.useProgram(image ? 'backgroundPattern' : 'background');

    const tileIDs = transform.coveringTiles({tileSize});

    if (image) {
        context.activeTexture.set(gl.TEXTURE0);
        painter.imageManager.bind(painter.context);
    }

    for (const tileID of tileIDs) {
        const matrix = painter.transform.calculatePosMatrix(tileID.toUnwrapped());

        const uniformValues = image ?
            backgroundPatternUniformValues(matrix, opacity, painter, image, {tileID, tileSize}) :
            backgroundUniformValues(matrix, opacity, color);

        program.draw(context, gl.TRIANGLES, depthMode, stencilMode, colorMode,
            uniformValues, layer.id, painter.tileExtentBuffer,
            painter.quadTriangleIndexBuffer, painter.tileExtentSegments);
    }
}
