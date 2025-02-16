// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, CrossFadedProperty, DataConstantProperty, DataDrivenProperty } = require('../properties');

const paint = new Properties({
  'fill-antialias': new DataConstantProperty(styleSpec['paint_fill']['fill-antialias']),
  'fill-opacity': new DataDrivenProperty(styleSpec['paint_fill']['fill-opacity']),
  'fill-color': new DataDrivenProperty(styleSpec['paint_fill']['fill-color']),
  'fill-outline-color': new DataDrivenProperty(styleSpec['paint_fill']['fill-outline-color']),
  'fill-translate': new DataConstantProperty(styleSpec['paint_fill']['fill-translate']),
  'fill-translate-anchor': new DataConstantProperty(styleSpec['paint_fill']['fill-translate-anchor']),
  'fill-pattern': new CrossFadedProperty(styleSpec['paint_fill']['fill-pattern'])
});

module.exports = { paint };
