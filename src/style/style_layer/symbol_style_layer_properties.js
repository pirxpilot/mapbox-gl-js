// This file is generated. Edit build/generate-style-code.js, then run `yarn run codegen`.
'use strict';
/* eslint-disable */

const styleSpec = require('../../style-spec/reference/latest');

const {
    Properties,
    DataConstantProperty,
    DataDrivenProperty
} = require ('../properties');

const layout = new Properties({
    "symbol-placement": new DataConstantProperty(styleSpec["layout_symbol"]["symbol-placement"]),
    "symbol-spacing": new DataConstantProperty(styleSpec["layout_symbol"]["symbol-spacing"]),
    "symbol-avoid-edges": new DataConstantProperty(styleSpec["layout_symbol"]["symbol-avoid-edges"]),
    "icon-allow-overlap": new DataConstantProperty(styleSpec["layout_symbol"]["icon-allow-overlap"]),
    "icon-ignore-placement": new DataConstantProperty(styleSpec["layout_symbol"]["icon-ignore-placement"]),
    "icon-optional": new DataConstantProperty(styleSpec["layout_symbol"]["icon-optional"]),
    "icon-rotation-alignment": new DataConstantProperty(styleSpec["layout_symbol"]["icon-rotation-alignment"]),
    "icon-size": new DataDrivenProperty(styleSpec["layout_symbol"]["icon-size"]),
    "icon-text-fit": new DataConstantProperty(styleSpec["layout_symbol"]["icon-text-fit"]),
    "icon-text-fit-padding": new DataConstantProperty(styleSpec["layout_symbol"]["icon-text-fit-padding"]),
    "icon-image": new DataDrivenProperty(styleSpec["layout_symbol"]["icon-image"]),
    "icon-rotate": new DataDrivenProperty(styleSpec["layout_symbol"]["icon-rotate"]),
    "icon-padding": new DataConstantProperty(styleSpec["layout_symbol"]["icon-padding"]),
    "icon-keep-upright": new DataConstantProperty(styleSpec["layout_symbol"]["icon-keep-upright"]),
    "icon-offset": new DataDrivenProperty(styleSpec["layout_symbol"]["icon-offset"]),
    "icon-anchor": new DataDrivenProperty(styleSpec["layout_symbol"]["icon-anchor"]),
    "icon-pitch-alignment": new DataConstantProperty(styleSpec["layout_symbol"]["icon-pitch-alignment"]),
    "text-pitch-alignment": new DataConstantProperty(styleSpec["layout_symbol"]["text-pitch-alignment"]),
    "text-rotation-alignment": new DataConstantProperty(styleSpec["layout_symbol"]["text-rotation-alignment"]),
    "text-field": new DataDrivenProperty(styleSpec["layout_symbol"]["text-field"]),
    "text-font": new DataDrivenProperty(styleSpec["layout_symbol"]["text-font"]),
    "text-size": new DataDrivenProperty(styleSpec["layout_symbol"]["text-size"]),
    "text-max-width": new DataDrivenProperty(styleSpec["layout_symbol"]["text-max-width"]),
    "text-line-height": new DataConstantProperty(styleSpec["layout_symbol"]["text-line-height"]),
    "text-letter-spacing": new DataDrivenProperty(styleSpec["layout_symbol"]["text-letter-spacing"]),
    "text-justify": new DataDrivenProperty(styleSpec["layout_symbol"]["text-justify"]),
    "text-anchor": new DataDrivenProperty(styleSpec["layout_symbol"]["text-anchor"]),
    "text-max-angle": new DataConstantProperty(styleSpec["layout_symbol"]["text-max-angle"]),
    "text-rotate": new DataDrivenProperty(styleSpec["layout_symbol"]["text-rotate"]),
    "text-padding": new DataConstantProperty(styleSpec["layout_symbol"]["text-padding"]),
    "text-keep-upright": new DataConstantProperty(styleSpec["layout_symbol"]["text-keep-upright"]),
    "text-transform": new DataDrivenProperty(styleSpec["layout_symbol"]["text-transform"]),
    "text-offset": new DataDrivenProperty(styleSpec["layout_symbol"]["text-offset"]),
    "text-allow-overlap": new DataConstantProperty(styleSpec["layout_symbol"]["text-allow-overlap"]),
    "text-ignore-placement": new DataConstantProperty(styleSpec["layout_symbol"]["text-ignore-placement"]),
    "text-optional": new DataConstantProperty(styleSpec["layout_symbol"]["text-optional"]),
});


const paint = new Properties({
    "icon-opacity": new DataDrivenProperty(styleSpec["paint_symbol"]["icon-opacity"]),
    "icon-color": new DataDrivenProperty(styleSpec["paint_symbol"]["icon-color"]),
    "icon-halo-color": new DataDrivenProperty(styleSpec["paint_symbol"]["icon-halo-color"]),
    "icon-halo-width": new DataDrivenProperty(styleSpec["paint_symbol"]["icon-halo-width"]),
    "icon-halo-blur": new DataDrivenProperty(styleSpec["paint_symbol"]["icon-halo-blur"]),
    "icon-translate": new DataConstantProperty(styleSpec["paint_symbol"]["icon-translate"]),
    "icon-translate-anchor": new DataConstantProperty(styleSpec["paint_symbol"]["icon-translate-anchor"]),
    "text-opacity": new DataDrivenProperty(styleSpec["paint_symbol"]["text-opacity"]),
    "text-color": new DataDrivenProperty(styleSpec["paint_symbol"]["text-color"]),
    "text-halo-color": new DataDrivenProperty(styleSpec["paint_symbol"]["text-halo-color"]),
    "text-halo-width": new DataDrivenProperty(styleSpec["paint_symbol"]["text-halo-width"]),
    "text-halo-blur": new DataDrivenProperty(styleSpec["paint_symbol"]["text-halo-blur"]),
    "text-translate": new DataConstantProperty(styleSpec["paint_symbol"]["text-translate"]),
    "text-translate-anchor": new DataConstantProperty(styleSpec["paint_symbol"]["text-translate-anchor"]),
});

module.exports = { paint, layout };
