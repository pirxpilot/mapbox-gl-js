// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const { Properties, CrossFadedProperty, DataConstantProperty } = require('../properties');

const paint = new Properties({
  'background-color': new DataConstantProperty({
    type: 'color',
    default: '#000000',
    transition: true,
    expression: { interpolated: true, parameters: ['zoom'] }
  }),
  'background-pattern': new CrossFadedProperty({
    type: 'string',
    transition: true,
    expression: { parameters: ['zoom'] }
  }),
  'background-opacity': new DataConstantProperty({
    type: 'number',
    default: 1,
    transition: true,
    expression: { interpolated: true, parameters: ['zoom'] }
  })
});

module.exports = { paint };
