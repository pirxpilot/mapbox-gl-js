// This file is generated. Edit build/generate-style-code.js, then run `yarn run codegen`.
'use strict';
/* eslint-disable */

const styleSpec = require('../../style-spec/reference/latest');

const {
    Properties,
    ColorRampProperty,
    DataConstantProperty,
    DataDrivenProperty,
} = require ('../properties');

const paint = new Properties({
    "heatmap-radius": new DataDrivenProperty(styleSpec["paint_heatmap"]["heatmap-radius"]),
    "heatmap-weight": new DataDrivenProperty(styleSpec["paint_heatmap"]["heatmap-weight"]),
    "heatmap-intensity": new DataConstantProperty(styleSpec["paint_heatmap"]["heatmap-intensity"]),
    "heatmap-color": new ColorRampProperty(styleSpec["paint_heatmap"]["heatmap-color"]),
    "heatmap-opacity": new DataConstantProperty(styleSpec["paint_heatmap"]["heatmap-opacity"]),
});

module.exports = { paint };
