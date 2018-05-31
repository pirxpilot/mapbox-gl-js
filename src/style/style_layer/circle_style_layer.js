'use strict';

const StyleLayer = require('../style_layer');

const CircleBucket = require('../../data/bucket/circle_bucket');
const { multiPolygonIntersectsBufferedPoint } = require('../../util/intersection_tests');
const { getMaximumPaintValue, translateDistance, translate } = require('../query_utils');
const properties = require('./circle_style_layer_properties');
const { vec4 } = require('gl-matrix');
const Point = require('@mapbox/point-geometry');


class CircleStyleLayer extends StyleLayer {

    constructor(layer) {
        super(layer, properties);
    }

    createBucket(parameters) {
        return new CircleBucket(parameters);
    }

    queryRadius(bucket) {
        const circleBucket = (bucket);
        return getMaximumPaintValue('circle-radius', this, circleBucket) +
            getMaximumPaintValue('circle-stroke-width', this, circleBucket) +
            translateDistance(this.paint.get('circle-translate'));
    }

    queryIntersectsFeature(queryGeometry,
                           feature,
                           featureState,
                           geometry,
                           zoom,
                           transform,
                           pixelsToTileUnits,
                           posMatrix) {
        const translatedPolygon = translate(queryGeometry,
            this.paint.get('circle-translate'),
            this.paint.get('circle-translate-anchor'),
            transform.angle, pixelsToTileUnits);
        const radius = this.paint.get('circle-radius').evaluate(feature, featureState);
        const stroke = this.paint.get('circle-stroke-width').evaluate(feature, featureState);
        const size  = radius + stroke;

        // For pitch-alignment: map, compare feature geometry to query geometry in the plane of the tile
        // // Otherwise, compare geometry in the plane of the viewport
        // // A circle with fixed scaling relative to the viewport gets larger in tile space as it moves into the distance
        // // A circle with fixed scaling relative to the map gets smaller in viewport space as it moves into the distance
        const alignWithMap = this.paint.get('circle-pitch-alignment') === 'map';
        const transformedPolygon = alignWithMap ? translatedPolygon : projectQueryGeometry(translatedPolygon, posMatrix, transform);
        const transformedSize = alignWithMap ? size * pixelsToTileUnits : size;

        for (const ring of geometry) {
            for (const point of ring) {

                const transformedPoint = alignWithMap ? point : projectPoint(point, posMatrix, transform);

                let adjustedSize = transformedSize;
                const projectedCenter = vec4.transformMat4([], [point.x, point.y, 0, 1], posMatrix);
                if (this.paint.get('circle-pitch-scale') === 'viewport' && this.paint.get('circle-pitch-alignment') === 'map') {
                    adjustedSize *= projectedCenter[3] / transform.cameraToCenterDistance;
                } else if (this.paint.get('circle-pitch-scale') === 'map' && this.paint.get('circle-pitch-alignment') === 'viewport') {
                    adjustedSize *= transform.cameraToCenterDistance / projectedCenter[3];
                }

                if (multiPolygonIntersectsBufferedPoint(transformedPolygon, transformedPoint, adjustedSize)) return true;
            }
        }

        return false;
    }
}

function projectPoint(p, posMatrix, transform) {
    const point = vec4.transformMat4([], [p.x, p.y, 0, 1], posMatrix);
    return new Point(
            (point[0] / point[3] + 1) * transform.width * 0.5,
            (point[1] / point[3] + 1) * transform.height * 0.5);
}

function projectQueryGeometry(queryGeometry, posMatrix, transform) {
    return queryGeometry.map((r) => {
        return r.map((p) => {
            return projectPoint(p, posMatrix, transform);
        });
    });
}

module.exports = CircleStyleLayer;
