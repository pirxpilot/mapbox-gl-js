const drawCollisionDebug = require('./draw_collision_debug');

const pixelsToTileUnits = require('../source/pixels_to_tile_units');
const symbolProjection = require('../symbol/projection');
const symbolSize = require('../symbol/symbol_size');
const { mat4 } = require('@mapbox/gl-matrix');
const identityMat4 = mat4.identity(new Float32Array(16));
const properties = require('../style/style_layer/symbol_style_layer_properties');
const symbolLayoutProperties = properties.layout;
const StencilMode = require('../gl/stencil_mode');
const DepthMode = require('../gl/depth_mode');
const CullFaceMode = require('../gl/cull_face_mode');
const { symbolIconUniformValues, symbolSDFUniformValues } = require('./program/symbol_program');

module.exports = drawSymbols;

function drawSymbols(painter, sourceCache, layer, coords) {
  if (painter.renderPass !== 'translucent') return;

  // Disable the stencil test so that labels aren't clipped to tile boundaries.
  const stencilMode = StencilMode.disabled;
  const colorMode = painter.colorModeForRenderPass();

  if (layer.paint.get('icon-opacity').constantOr(1) !== 0) {
    drawLayerSymbols(
      painter,
      sourceCache,
      layer,
      coords,
      false,
      layer.paint.get('icon-translate'),
      layer.paint.get('icon-translate-anchor'),
      layer.layout.get('icon-rotation-alignment'),
      layer.layout.get('icon-pitch-alignment'),
      layer.layout.get('icon-keep-upright'),
      stencilMode,
      colorMode
    );
  }

  if (layer.paint.get('text-opacity').constantOr(1) !== 0) {
    drawLayerSymbols(
      painter,
      sourceCache,
      layer,
      coords,
      true,
      layer.paint.get('text-translate'),
      layer.paint.get('text-translate-anchor'),
      layer.layout.get('text-rotation-alignment'),
      layer.layout.get('text-pitch-alignment'),
      layer.layout.get('text-keep-upright'),
      stencilMode,
      colorMode
    );
  }

  if (sourceCache.map.showCollisionBoxes) {
    drawCollisionDebug(painter, sourceCache, layer, coords);
  }
}

function drawLayerSymbols(
  painter,
  sourceCache,
  layer,
  coords,
  isText,
  translate,
  translateAnchor,
  rotationAlignment,
  pitchAlignment,
  keepUpright,
  stencilMode,
  colorMode
) {
  const context = painter.context;
  const gl = context.gl;
  const tr = painter.transform;

  const rotateWithMap = rotationAlignment === 'map';
  const pitchWithMap = pitchAlignment === 'map';
  const alongLine = rotateWithMap && layer.layout.get('symbol-placement') !== 'point';
  // Line label rotation happens in `updateLineLabels`
  // Pitched point labels are automatically rotated by the labelPlaneMatrix projection
  // Unpitched point labels need to have their rotation applied after projection
  const rotateInShader = rotateWithMap && !pitchWithMap && !alongLine;

  const depthMode = painter.depthModeForSublayer(0, DepthMode.ReadOnly);

  let program;
  let size;

  for (const coord of coords) {
    const tile = sourceCache.getTile(coord);
    const bucket = tile.getBucket(layer);
    if (!bucket) continue;
    const buffers = isText ? bucket.text : bucket.icon;
    if (!buffers || !buffers.segments.get().length) continue;
    const programConfiguration = buffers.programConfigurations.get(layer.id);

    const isSDF = isText || bucket.sdfIcons;

    const sizeData = isText ? bucket.textSizeData : bucket.iconSizeData;

    if (!program) {
      program = painter.useProgram(isSDF ? 'symbolSDF' : 'symbolIcon', programConfiguration);
      size = symbolSize.evaluateSizeForZoom(
        sizeData,
        tr.zoom,
        symbolLayoutProperties.properties[isText ? 'text-size' : 'icon-size']
      );
    }

    context.activeTexture.set(gl.TEXTURE0);

    let texSize;
    if (isText) {
      tile.glyphAtlasTexture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);
      texSize = tile.glyphAtlasTexture.size;
    } else {
      const iconScaled = layer.layout.get('icon-size').constantOr(0) !== 1 || bucket.iconsNeedLinear;
      const iconTransformed = pitchWithMap || tr.pitch !== 0;

      tile.imageAtlasTexture.bind(
        isSDF || painter.options.rotating || painter.options.zooming || iconScaled || iconTransformed
          ? gl.LINEAR
          : gl.NEAREST,
        gl.CLAMP_TO_EDGE
      );

      texSize = tile.imageAtlasTexture.size;
    }

    const s = pixelsToTileUnits(tile, 1, painter.transform.zoom);
    const labelPlaneMatrix = symbolProjection.getLabelPlaneMatrix(
      coord.posMatrix,
      pitchWithMap,
      rotateWithMap,
      painter.transform,
      s
    );
    const glCoordMatrix = symbolProjection.getGlCoordMatrix(
      coord.posMatrix,
      pitchWithMap,
      rotateWithMap,
      painter.transform,
      s
    );

    if (alongLine) {
      symbolProjection.updateLineLabels(
        bucket,
        coord.posMatrix,
        painter,
        isText,
        labelPlaneMatrix,
        glCoordMatrix,
        pitchWithMap,
        keepUpright
      );
    }

    const matrix = painter.translatePosMatrix(coord.posMatrix, tile, translate, translateAnchor);
    const uLabelPlaneMatrix = alongLine ? identityMat4 : labelPlaneMatrix;
    const uglCoordMatrix = painter.translatePosMatrix(glCoordMatrix, tile, translate, translateAnchor, true);

    let uniformValues;
    if (isSDF) {
      const hasHalo = layer.paint.get(isText ? 'text-halo-width' : 'icon-halo-width').constantOr(1) !== 0;

      uniformValues = symbolSDFUniformValues(
        sizeData.functionType,
        size,
        rotateInShader,
        pitchWithMap,
        painter,
        matrix,
        uLabelPlaneMatrix,
        uglCoordMatrix,
        isText,
        texSize,
        true
      );

      if (hasHalo) {
        drawSymbolElements(buffers, layer, painter, program, depthMode, stencilMode, colorMode, uniformValues);
      }

      uniformValues['u_is_halo'] = 0;
    } else {
      uniformValues = symbolIconUniformValues(
        sizeData.functionType,
        size,
        rotateInShader,
        pitchWithMap,
        painter,
        matrix,
        uLabelPlaneMatrix,
        uglCoordMatrix,
        isText,
        texSize
      );
    }

    drawSymbolElements(buffers, layer, painter, program, depthMode, stencilMode, colorMode, uniformValues);
  }
}

function drawSymbolElements(buffers, layer, painter, program, depthMode, stencilMode, colorMode, uniformValues) {
  const context = painter.context;
  const gl = context.gl;
  program.draw(
    context,
    gl.TRIANGLES,
    depthMode,
    stencilMode,
    colorMode,
    CullFaceMode.disabled,
    uniformValues,
    layer.id,
    buffers.layoutVertexBuffer,
    buffers.indexBuffer,
    buffers.segments,
    layer.paint,
    painter.transform.zoom,
    buffers.programConfigurations.get(layer.id),
    buffers.dynamicLayoutVertexBuffer,
    buffers.opacityVertexBuffer
  );
}
