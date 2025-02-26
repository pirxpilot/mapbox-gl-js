// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, DataConstantProperty, DataDrivenProperty } = require('../properties');

const paint = new Properties({
  'circle-radius': new DataDrivenProperty(styleSpec['paint_circle']['circle-radius']),
  'circle-color': new DataDrivenProperty(styleSpec['paint_circle']['circle-color']),
  'circle-blur': new DataDrivenProperty(styleSpec['paint_circle']['circle-blur']),
  'circle-opacity': new DataDrivenProperty(styleSpec['paint_circle']['circle-opacity']),
  'circle-translate': new DataConstantProperty(styleSpec['paint_circle']['circle-translate']),
  'circle-translate-anchor': new DataConstantProperty(styleSpec['paint_circle']['circle-translate-anchor']),
  'circle-pitch-scale': new DataConstantProperty(styleSpec['paint_circle']['circle-pitch-scale']),
  'circle-pitch-alignment': new DataConstantProperty(styleSpec['paint_circle']['circle-pitch-alignment']),
  'circle-stroke-width': new DataDrivenProperty(styleSpec['paint_circle']['circle-stroke-width']),
  'circle-stroke-color': new DataDrivenProperty(styleSpec['paint_circle']['circle-stroke-color']),
  'circle-stroke-opacity': new DataDrivenProperty(styleSpec['paint_circle']['circle-stroke-opacity'])
});

module.exports = { paint };
