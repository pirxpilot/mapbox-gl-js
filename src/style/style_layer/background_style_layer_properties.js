// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, CrossFadedProperty, DataConstantProperty } = require('../properties');

const paint = new Properties({
  'background-color': new DataConstantProperty(styleSpec['paint_background']['background-color']),
  'background-pattern': new CrossFadedProperty(styleSpec['paint_background']['background-pattern']),
  'background-opacity': new DataConstantProperty(styleSpec['paint_background']['background-opacity'])
});

module.exports = { paint };
