const Texture = require('./texture');
const Color = require('../style-spec/util/color');
const DepthMode = require('../gl/depth_mode');
const StencilMode = require('../gl/stencil_mode');
const CullFaceMode = require('../gl/cull_face_mode');
const {
  fillExtrusionUniformValues,
  fillExtrusionPatternUniformValues,
  extrusionTextureUniformValues
} = require('./program/fill_extrusion_program');

module.exports = draw;

function draw(painter, source, layer, coords) {
  if (layer.paint.get('fill-extrusion-opacity') === 0) {
    return;
  }

  if (painter.renderPass === 'offscreen') {
    drawToExtrusionFramebuffer(painter, layer);

    const depthMode = new DepthMode(painter.context.gl.LEQUAL, DepthMode.ReadWrite, [0, 1]);
    const stencilMode = StencilMode.disabled;
    const colorMode = painter.colorModeForRenderPass();

    drawExtrusionTiles(painter, source, layer, coords, depthMode, stencilMode, colorMode);
  } else if (painter.renderPass === 'translucent') {
    drawExtrusionTexture(painter, layer);
  }
}

function drawToExtrusionFramebuffer(painter, layer) {
  const context = painter.context;
  const gl = context.gl;

  let renderTarget = layer.viewportFrame;

  if (painter.depthRboNeedsClear) {
    painter.setupOffscreenDepthRenderbuffer();
  }

  if (!renderTarget) {
    const texture = new Texture(context, { width: painter.width, height: painter.height, data: null }, gl.RGBA);
    texture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);

    renderTarget = layer.viewportFrame = context.createFramebuffer(painter.width, painter.height);
    renderTarget.colorAttachment.set(texture.texture);
  }

  context.bindFramebuffer.set(renderTarget.framebuffer);
  renderTarget.depthAttachment.set(painter.depthRbo);

  if (painter.depthRboNeedsClear) {
    context.clear({ depth: 1 });
    painter.depthRboNeedsClear = false;
  }

  context.clear({ color: Color.transparent });
}

function drawExtrusionTexture(painter, layer) {
  const renderedTexture = layer.viewportFrame;
  if (!renderedTexture) return;

  const context = painter.context;
  const gl = context.gl;

  context.activeTexture.set(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderedTexture.colorAttachment.get());

  painter
    .useProgram('extrusionTexture')
    .draw(
      context,
      gl.TRIANGLES,
      DepthMode.disabled,
      StencilMode.disabled,
      painter.colorModeForRenderPass(),
      CullFaceMode.disabled,
      extrusionTextureUniformValues(painter, layer, 0),
      layer.id,
      painter.viewportBuffer,
      painter.quadTriangleIndexBuffer,
      painter.viewportSegments,
      layer.paint,
      painter.transform.zoom
    );
}

function drawExtrusionTiles(painter, source, layer, coords, depthMode, stencilMode, colorMode) {
  const context = painter.context;
  const gl = context.gl;

  const patternProperty = layer.paint.get('fill-extrusion-pattern');
  const image = patternProperty.constantOr(1);
  const crossfade = layer.getCrossfadeParameters();

  for (const coord of coords) {
    const tile = source.getTile(coord);
    const bucket = tile.getBucket(layer);
    if (!bucket) continue;

    const programConfiguration = bucket.programConfigurations.get(layer.id);
    const program = painter.useProgram(image ? 'fillExtrusionPattern' : 'fillExtrusion', programConfiguration);

    if (image) {
      painter.context.activeTexture.set(gl.TEXTURE0);
      tile.imageAtlasTexture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);
      programConfiguration.updatePatternPaintBuffers(crossfade);
    }

    const constantPattern = patternProperty.constantOr(null);
    if (constantPattern && tile.imageAtlas) {
      const posTo = tile.imageAtlas.patternPositions[constantPattern.to];
      const posFrom = tile.imageAtlas.patternPositions[constantPattern.from];
      if (posTo && posFrom) programConfiguration.setConstantPatternPositions(posTo, posFrom);
    }

    const matrix = painter.translatePosMatrix(
      coord.posMatrix,
      tile,
      layer.paint.get('fill-extrusion-translate'),
      layer.paint.get('fill-extrusion-translate-anchor')
    );

    const uniformValues = image
      ? fillExtrusionPatternUniformValues(matrix, painter, coord, crossfade, tile)
      : fillExtrusionUniformValues(matrix, painter);

    program.draw(
      context,
      context.gl.TRIANGLES,
      depthMode,
      stencilMode,
      colorMode,
      CullFaceMode.backCCW,
      uniformValues,
      layer.id,
      bucket.layoutVertexBuffer,
      bucket.indexBuffer,
      bucket.segments,
      layer.paint,
      painter.transform.zoom,
      programConfiguration
    );
  }
}
