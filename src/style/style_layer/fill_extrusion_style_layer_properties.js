// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, CrossFadedProperty, DataConstantProperty, DataDrivenProperty } = require('../properties');

const paint = new Properties({
  'fill-extrusion-opacity': new DataConstantProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-opacity']),
  'fill-extrusion-color': new DataDrivenProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-color']),
  'fill-extrusion-translate': new DataConstantProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-translate']),
  'fill-extrusion-translate-anchor': new DataConstantProperty(
    styleSpec['paint_fill-extrusion']['fill-extrusion-translate-anchor']
  ),
  'fill-extrusion-pattern': new CrossFadedProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-pattern']),
  'fill-extrusion-height': new DataDrivenProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-height']),
  'fill-extrusion-base': new DataDrivenProperty(styleSpec['paint_fill-extrusion']['fill-extrusion-base'])
});

module.exports = { paint };
