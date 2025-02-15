/* eslint-disable */

const styleSpec = require('../../style-spec/reference/latest');

const { Properties, DataConstantProperty } = require('../properties');

const paint = new Properties({
  'hillshade-illumination-direction': new DataConstantProperty(
    styleSpec['paint_hillshade']['hillshade-illumination-direction']
  ),
  'hillshade-illumination-anchor': new DataConstantProperty(
    styleSpec['paint_hillshade']['hillshade-illumination-anchor']
  ),
  'hillshade-exaggeration': new DataConstantProperty(styleSpec['paint_hillshade']['hillshade-exaggeration']),
  'hillshade-shadow-color': new DataConstantProperty(styleSpec['paint_hillshade']['hillshade-shadow-color']),
  'hillshade-highlight-color': new DataConstantProperty(styleSpec['paint_hillshade']['hillshade-highlight-color']),
  'hillshade-accent-color': new DataConstantProperty(styleSpec['paint_hillshade']['hillshade-accent-color'])
});

module.exports = { paint };
