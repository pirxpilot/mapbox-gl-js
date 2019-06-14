"use strict";

const { fillExtrusionUniforms, fillExtrusionPatternUniforms, extrusionTextureUniforms } = require('./fill_extrusion_program');
const { fillUniforms, fillPatternUniforms, fillOutlineUniforms, fillOutlinePatternUniforms } = require('./fill_program');
const { circleUniforms } = require('./circle_program');
const { collisionUniforms } = require('./collision_program');
const { debugUniforms } = require('./debug_program');
const { clippingMaskUniforms } = require('./clipping_mask_program');
const { heatmapUniforms, heatmapTextureUniforms } = require('./heatmap_program');
const { hillshadeUniforms, hillshadePrepareUniforms } = require('./hillshade_program');
const { lineUniforms, lineGradientUniforms, linePatternUniforms, lineSDFUniforms } = require('./line_program');
const { rasterUniforms } = require('./raster_program');
const { symbolIconUniforms, symbolSDFUniforms } = require('./symbol_program');
const { backgroundUniforms, backgroundPatternUniforms } = require('./background_program');

const programUniforms = {
    fillExtrusion: fillExtrusionUniforms,
    fillExtrusionPattern: fillExtrusionPatternUniforms,
    extrusionTexture: extrusionTextureUniforms,
    fill: fillUniforms,
    fillPattern: fillPatternUniforms,
    fillOutline: fillOutlineUniforms,
    fillOutlinePattern: fillOutlinePatternUniforms,
    circle: circleUniforms,
    collisionBox: collisionUniforms,
    collisionCircle: collisionUniforms,
    debug: debugUniforms,
    clippingMask: clippingMaskUniforms,
    heatmap: heatmapUniforms,
    heatmapTexture: heatmapTextureUniforms,
    hillshade: hillshadeUniforms,
    hillshadePrepare: hillshadePrepareUniforms,
    line: lineUniforms,
    lineGradient: lineGradientUniforms,
    linePattern: linePatternUniforms,
    lineSDF: lineSDFUniforms,
    raster: rasterUniforms,
    symbolIcon: symbolIconUniforms,
    symbolSDF: symbolSDFUniforms,
    background: backgroundUniforms,
    backgroundPattern: backgroundPatternUniforms
};

module.exports = { programUniforms };
