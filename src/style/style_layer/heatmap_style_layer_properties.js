// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, ColorRampProperty, DataConstantProperty, DataDrivenProperty } = require('../properties');

const paint = new Properties({
  'heatmap-radius': new DataDrivenProperty(styleSpec['paint_heatmap']['heatmap-radius']),
  'heatmap-weight': new DataDrivenProperty(styleSpec['paint_heatmap']['heatmap-weight']),
  'heatmap-intensity': new DataConstantProperty(styleSpec['paint_heatmap']['heatmap-intensity']),
  'heatmap-color': new ColorRampProperty(styleSpec['paint_heatmap']['heatmap-color']),
  'heatmap-opacity': new DataConstantProperty(styleSpec['paint_heatmap']['heatmap-opacity'])
});

module.exports = { paint };
