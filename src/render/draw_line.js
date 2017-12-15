'use strict';

const DepthMode = require('../gl/depth_mode');
const Texture = require('./texture');
const {
    lineUniformValues,
    linePatternUniformValues,
    lineSDFUniformValues,
    lineGradientUniformValues
} = require('./program/line_program');


module.exports = function drawLine(painter, sourceCache, layer, coords) {
    if (painter.renderPass !== 'translucent') return;

    const opacity = layer.paint.get('line-opacity');
    const width = layer.paint.get('line-width');
    if (opacity.constantOr(1) === 0 || width.constantOr(1) === 0) return;

    const depthMode = painter.depthModeForSublayer(0, DepthMode.ReadOnly);
    const colorMode = painter.colorModeForRenderPass();

    const programId =
        layer.paint.get('line-dasharray') ? 'lineSDF' :
        layer.paint.get('line-pattern') ? 'linePattern' :
        layer.paint.get('line-gradient') ? 'lineGradient' : 'line';

    let firstTile = true;

    for (const coord of coords) {
        const tile = sourceCache.getTile(coord);
        const bucket = (tile.getBucket(layer));
        if (!bucket) continue;

        const programConfiguration = bucket.programConfigurations.get(layer.id);
        const prevProgram = painter.context.program.get();
        const program = painter.useProgram(programId, programConfiguration);
        const programChanged = firstTile || program.program !== prevProgram;

        drawLineTile(program, painter, tile, bucket, layer, coord, depthMode, colorMode, programConfiguration, programChanged);
        firstTile = false;
        // once refactored so that bound texture state is managed, we'll also be able to remove this firstTile/programChanged logic
    }
};

function drawLineTile(program, painter, tile, bucket, layer, coord, depthMode, colorMode, programConfiguration, programChanged) {
    const context = painter.context;
    const gl = context.gl;
    const dasharray = layer.paint.get('line-dasharray');
    const image = layer.paint.get('line-pattern');
    const gradient = layer.paint.get('line-gradient');

    if (painter.isPatternMissing(image)) return;

    const uniformValues = dasharray ? lineSDFUniformValues(painter, tile, layer, dasharray) :
        image ? linePatternUniformValues(painter, tile, layer, image) :
        gradient ? lineGradientUniformValues(painter, tile, layer) :
        lineUniformValues(painter, tile, layer);

    if (programChanged) {
        if (dasharray) {
            context.activeTexture.set(gl.TEXTURE0);
            painter.lineAtlas.bind(context);
        } else if (image) {
            context.activeTexture.set(gl.TEXTURE0);
            painter.imageManager.bind(context);
        }
    }

    if (gradient) {
        context.activeTexture.set(gl.TEXTURE0);

        let gradientTexture = layer.gradientTexture;
        if (!layer.gradient) return;
        if (!gradientTexture) gradientTexture = layer.gradientTexture = new Texture(context, layer.gradient, gl.RGBA);
        gradientTexture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);
    }

    program.draw(context, gl.TRIANGLES, depthMode,
        painter.stencilModeForClipping(coord), colorMode, uniformValues,
        layer.id, bucket.layoutVertexBuffer, bucket.indexBuffer, bucket.segments,
        layer.paint, painter.transform.zoom, programConfiguration);
}
