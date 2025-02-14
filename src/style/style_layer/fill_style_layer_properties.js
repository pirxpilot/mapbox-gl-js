// This file is generated. Edit build/generate-style-code.js, then run `yarn run codegen`.
'use strict';
/* eslint-disable */

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, DataConstantProperty, DataDrivenProperty, CrossFadedProperty } = require('../properties');

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
