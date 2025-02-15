// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, DataConstantProperty } = require('../properties');

const paint = new Properties({
  'raster-opacity': new DataConstantProperty(styleSpec['paint_raster']['raster-opacity']),
  'raster-hue-rotate': new DataConstantProperty(styleSpec['paint_raster']['raster-hue-rotate']),
  'raster-brightness-min': new DataConstantProperty(styleSpec['paint_raster']['raster-brightness-min']),
  'raster-brightness-max': new DataConstantProperty(styleSpec['paint_raster']['raster-brightness-max']),
  'raster-saturation': new DataConstantProperty(styleSpec['paint_raster']['raster-saturation']),
  'raster-contrast': new DataConstantProperty(styleSpec['paint_raster']['raster-contrast']),
  'raster-resampling': new DataConstantProperty(styleSpec['paint_raster']['raster-resampling']),
  'raster-fade-duration': new DataConstantProperty(styleSpec['paint_raster']['raster-fade-duration'])
});

module.exports = { paint };
