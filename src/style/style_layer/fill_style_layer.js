const StyleLayer = require('../style_layer');

const FillBucket = require('../../data/bucket/fill_bucket');
const { multiPolygonIntersectsMultiPolygon } = require('../../util/intersection_tests');
const { translateDistance, translate } = require('../query_utils');
const properties = require('./fill_style_layer_properties');

class FillStyleLayer extends StyleLayer {
  constructor(layer) {
    super(layer, properties);
  }

  recalculate(parameters) {
    this.paint = this._transitioningPaint.possiblyEvaluate(parameters);

    const outlineColor = this.paint._values['fill-outline-color'];
    if (outlineColor.value.kind === 'constant' && outlineColor.value.value === undefined) {
      this.paint._values['fill-outline-color'] = this.paint._values['fill-color'];
    }
  }

  createBucket(parameters) {
    return new FillBucket(parameters);
  }

  queryRadius() {
    return translateDistance(this.paint.get('fill-translate'));
  }

  queryIntersectsFeature(queryGeometry, feature, featureState, geometry, zoom, transform, pixelsToTileUnits) {
    const translatedPolygon = translate(
      queryGeometry,
      this.paint.get('fill-translate'),
      this.paint.get('fill-translate-anchor'),
      transform.angle,
      pixelsToTileUnits
    );
    return multiPolygonIntersectsMultiPolygon(translatedPolygon, geometry);
  }
}

module.exports = FillStyleLayer;
