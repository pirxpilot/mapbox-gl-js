const Point = require('@mapbox/point-geometry');

const mvt = require('@mapbox/vector-tile');
const toGeoJSON = mvt.VectorTileFeature.prototype.toGeoJSON;
const EXTENT = require('../data/extent');

// The feature type used by geojson-vt and supercluster. Should be extracted to
// global type and used in module definitions for those two modules.

class FeatureWrapper {
  constructor(feature) {
    this._feature = feature;

    this.extent = EXTENT;
    this.type = feature.type;
    this.properties = feature.tags;

    // If the feature has a top-level `id` property, copy it over, but only
    // if it can be coerced to an integer, because this wrapper is used for
    // serializing geojson feature data into vector tile PBF data, and the
    // vector tile spec only supports integer values for feature ids --
    // allowing non-integer values here results in a non-compliant PBF
    // that causes an exception when it is parsed with vector-tile-js
    if ('id' in feature && !isNaN(feature.id)) {
      this.id = Number.parseInt(feature.id, 10);
    }
  }

  loadGeometry() {
    if (this._feature.type === 1) {
      const geometry = [];
      for (const point of this._feature.geometry) {
        geometry.push([new Point(point[0], point[1])]);
      }
      return geometry;
    }
    const geometry = [];
    for (const ring of this._feature.geometry) {
      const newRing = [];
      for (const point of ring) {
        newRing.push(new Point(point[0], point[1]));
      }
      geometry.push(newRing);
    }
    return geometry;
  }

  toGeoJSON(x, y, z) {
    return toGeoJSON.call(this, x, y, z);
  }
}

class GeoJSONWrapper {
  constructor(features) {
    this.layers = { _geojsonTileLayer: this };
    this.name = '_geojsonTileLayer';
    this.extent = EXTENT;
    this.length = features.length;
    this._features = features;
  }

  feature(i) {
    return new FeatureWrapper(this._features[i]);
  }
}

module.exports = GeoJSONWrapper;
