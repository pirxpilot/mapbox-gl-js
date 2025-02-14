// This file is generated. Edit build/generate-style-code.js, then run `yarn run codegen`.
'use strict';
/* eslint-disable */

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, DataConstantProperty, CrossFadedProperty } = require('../properties');

const paint = new Properties({
  'background-color': new DataConstantProperty(styleSpec['paint_background']['background-color']),
  'background-pattern': new CrossFadedProperty(styleSpec['paint_background']['background-pattern']),
  'background-opacity': new DataConstantProperty(styleSpec['paint_background']['background-opacity'])
});

module.exports = { paint };
