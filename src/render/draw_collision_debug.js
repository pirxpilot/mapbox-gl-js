'use strict';

const DepthMode = require('../gl/depth_mode');
const StencilMode = require('../gl/stencil_mode');
const { collisionUniformValues } = require('./program/collision_program');


module.exports = drawCollisionDebug;

function drawCollisionDebugGeometry(painter, sourceCache, layer, coords, drawCircles) {
    const context = painter.context;
    const gl = context.gl;
    const program = drawCircles ? painter.useProgram('collisionCircle') : painter.useProgram('collisionBox');

    for (let i = 0; i < coords.length; i++) {
        const coord = coords[i];
        const tile = sourceCache.getTile(coord);
        const bucket = (tile.getBucket(layer));
        if (!bucket) continue;
        const buffers = drawCircles ? bucket.collisionCircle : bucket.collisionBox;
        if (!buffers) continue;

        program.draw(context, drawCircles ? gl.TRIANGLES : gl.LINES,
            DepthMode.disabled, StencilMode.disabled,
            painter.colorModeForRenderPass(),
            collisionUniformValues(
                coord.posMatrix,
                painter.transform,
                tile),
            layer.id, buffers.layoutVertexBuffer, buffers.indexBuffer,
            buffers.segments, null, painter.transform.zoom, null, null,
            buffers.collisionVertexBuffer);
    }
}

function drawCollisionDebug(painter, sourceCache, layer, coords) {
    drawCollisionDebugGeometry(painter, sourceCache, layer, coords, false);
    drawCollisionDebugGeometry(painter, sourceCache, layer, coords, true);
}
