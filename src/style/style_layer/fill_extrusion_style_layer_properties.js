// This file is generated. Edit layer-properties.js.ejs, then run `make generate-style-code`.

const { Properties, CrossFadedProperty, DataConstantProperty, DataDrivenProperty } = require('../properties');

const paint = new Properties({
  'fill-extrusion-opacity': new DataConstantProperty({
    type: 'number',
    default: 1,
    transition: true,
    expression: { interpolated: true, parameters: ['zoom'] }
  }),
  'fill-extrusion-color': new DataDrivenProperty({
    type: 'color',
    default: '#000000',
    transition: true,
    expression: { interpolated: true, parameters: ['zoom', 'feature'] }
  }),
  'fill-extrusion-translate': new DataConstantProperty({
    type: 'array',
    value: 'number',
    length: 2,
    default: [0, 0],
    transition: true,
    expression: { interpolated: true, parameters: ['zoom'] }
  }),
  'fill-extrusion-translate-anchor': new DataConstantProperty({
    type: 'enum',
    values: ['map', 'viewport'],
    default: 'map',
    expression: { parameters: ['zoom'] }
  }),
  'fill-extrusion-pattern': new CrossFadedProperty({
    type: 'string',
    transition: true,
    expression: { parameters: ['zoom'] }
  }),
  'fill-extrusion-height': new DataDrivenProperty({
    type: 'number',
    default: 0,
    transition: true,
    expression: { interpolated: true, parameters: ['zoom', 'feature'] }
  }),
  'fill-extrusion-base': new DataDrivenProperty({
    type: 'number',
    default: 0,
    transition: true,
    expression: { interpolated: true, parameters: ['zoom', 'feature'] }
  })
});

module.exports = { paint };
