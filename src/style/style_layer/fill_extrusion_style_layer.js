'use strict';

const StyleLayer = require('../style_layer');

const FillExtrusionBucket = require('../../data/bucket/fill_extrusion_bucket');
const { multiPolygonIntersectsMultiPolygon } = require('../../util/intersection_tests');
const { translateDistance, translate } = require('../query_utils');
const properties = require('./fill_extrusion_style_layer_properties');

class FillExtrusionStyleLayer extends StyleLayer {
  constructor(layer) {
    super(layer, properties);
  }

  createBucket(parameters) {
    return new FillExtrusionBucket(parameters);
  }

  queryRadius() {
    return translateDistance(this.paint.get('fill-extrusion-translate'));
  }

  queryIntersectsFeature(queryGeometry, feature, featureState, geometry, zoom, transform, pixelsToTileUnits) {
    const translatedPolygon = translate(
      queryGeometry,
      this.paint.get('fill-extrusion-translate'),
      this.paint.get('fill-extrusion-translate-anchor'),
      transform.angle,
      pixelsToTileUnits
    );
    return multiPolygonIntersectsMultiPolygon(translatedPolygon, geometry);
  }

  hasOffscreenPass() {
    return this.paint.get('fill-extrusion-opacity') !== 0 && this.visibility !== 'none';
  }

  resize() {
    if (this.viewportFrame) {
      this.viewportFrame.destroy();
      this.viewportFrame = null;
    }
  }
}

module.exports = FillExtrusionStyleLayer;
