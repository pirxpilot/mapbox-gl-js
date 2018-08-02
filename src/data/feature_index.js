'use strict';

const loadGeometry = require('./load_geometry');
const EXTENT = require('./extent');
const featureFilter = require('../style-spec/feature_filter');
const Grid = require('grid-index');
const DictionaryCoder = require('../util/dictionary_coder');
const vt = require('@mapbox/vector-tile');
const Protobuf = require('pbf');
const GeoJSONFeature = require('../util/vectortile_to_geojson');
const { arraysIntersect } = require('../util/object');
const { register } = require('../util/web_worker_transfer');
const EvaluationParameters = require('../style/evaluation_parameters');


const { FeatureIndexArray } = require('./array_types');


class FeatureIndex {



    constructor(tileID,
                grid = new Grid(EXTENT, 16, 0),
                featureIndexArray = new FeatureIndexArray()) {
        this.tileID = tileID;
        this.x = tileID.canonical.x;
        this.y = tileID.canonical.y;
        this.z = tileID.canonical.z;
        this.grid = grid;
        this.featureIndexArray = featureIndexArray;
    }

    insert(feature, geometry, featureIndex, sourceLayerIndex, bucketIndex) {
        const key = this.featureIndexArray.length;
        this.featureIndexArray.emplaceBack(featureIndex, sourceLayerIndex, bucketIndex);

        for (const ring of geometry) {
            let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
            for (const { x, y } of ring) {
                if (x < xMin) { xMin = x; } else if (x > xMax) { xMax = x; }
                if (y < yMin) { yMin = y; } else if (y > yMax) { yMax = y; }
            }

            if (xMin < EXTENT &&
                yMin < EXTENT &&
                xMax >= 0 &&
                yMax >= 0) {
                this.grid.insert(key, xMin, yMin, xMax, yMax);
            }
        }
    }

    loadVTLayers() {
        if (!this.vtLayers) {
            this.vtLayers = new vt.VectorTile(new Protobuf(this.rawTileData)).layers;
            this.sourceLayerCoder = new DictionaryCoder(this.vtLayers ? Object.keys(this.vtLayers).sort() : ['_geojsonTileLayer']);
        }
        return this.vtLayers;
    }

    // Finds non-symbol features in this tile at a particular position.
    query(args, styleLayers, sourceFeatureState) {
        this.loadVTLayers();

        const { params = {} } = args,
            pixelsToTileUnits = EXTENT / args.tileSize / args.scale,
            filter = featureFilter(params.filter);

        const queryGeometry = args.queryGeometry;
        const queryPadding = args.queryPadding * pixelsToTileUnits;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < queryGeometry.length; i++) {
            const ring = queryGeometry[i];
            for (let k = 0; k < ring.length; k++) {
                const p = ring[k];
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            }
        }

        const matching = this.grid.query(minX - queryPadding, minY - queryPadding, maxX + queryPadding, maxY + queryPadding);
        matching.sort(topDownFeatureComparator);
        const result = {};
        let previousIndex;
        for (let k = 0; k < matching.length; k++) {
            const index = matching[k];

            // don't check the same feature more than once
            if (index === previousIndex) continue;
            previousIndex = index;

            const match = this.featureIndexArray.get(index);
            let featureGeometry = null;
            this.loadMatchingFeature(
                result,
                match.bucketIndex,
                match.sourceLayerIndex,
                match.featureIndex,
                filter,
                params.layers,
                styleLayers,
                (feature, styleLayer) => {
                    if (!featureGeometry) {
                        featureGeometry = loadGeometry(feature);
                    }
                    let featureState = {};
                    if (feature.id) {
                        // `feature-state` expression evaluation requires feature state to be available
                        featureState = sourceFeatureState.getState(styleLayer.sourceLayer || '_geojsonTileLayer', String(feature.id));
                    }
                    return styleLayer.queryIntersectsFeature(queryGeometry, feature, featureState, featureGeometry, this.z, args.transform, pixelsToTileUnits, args.posMatrix);
                }
            );
        }

        return result;
    }

    loadMatchingFeature(
        result,
        bucketIndex,
        sourceLayerIndex,
        featureIndex,
        filter,
        filterLayerIDs,
        styleLayers,
        intersectionTest) {

        const layerIDs = this.bucketLayerIDs[bucketIndex];
        if (filterLayerIDs && !arraysIntersect(filterLayerIDs, layerIDs))
            return;

        const sourceLayerName = this.sourceLayerCoder.decode(sourceLayerIndex);
        const sourceLayer = this.vtLayers[sourceLayerName];
        const feature = sourceLayer.feature(featureIndex);

        if (!filter(new EvaluationParameters(this.tileID.overscaledZ), feature))
            return;

        for (let l = 0; l < layerIDs.length; l++) {
            const layerID = layerIDs[l];

            if (filterLayerIDs && filterLayerIDs.indexOf(layerID) < 0) {
                continue;
            }

            const styleLayer = styleLayers[layerID];
            if (!styleLayer) continue;

            if (intersectionTest && !intersectionTest(feature, styleLayer)) {
                // Only applied for non-symbol features
                continue;
            }

            const geojsonFeature = new GeoJSONFeature(feature, this.z, this.x, this.y);
            (geojsonFeature).layer = styleLayer.serialize();
            let layerResult = result[layerID];
            if (layerResult === undefined) {
                layerResult = result[layerID] = [];
            }
            layerResult.push({ featureIndex: featureIndex, feature: geojsonFeature });
        }
    }

    // Given a set of symbol indexes that have already been looked up,
    // return a matching set of GeoJSONFeatures
    lookupSymbolFeatures(symbolFeatureIndexes,
                         bucketIndex,
                         sourceLayerIndex,
                         filterSpec,
                         filterLayerIDs,
                         styleLayers) {
        const result = {};
        this.loadVTLayers();

        const filter = featureFilter(filterSpec);

        for (const symbolFeatureIndex of symbolFeatureIndexes) {
            this.loadMatchingFeature(
                result,
                bucketIndex,
                sourceLayerIndex,
                symbolFeatureIndex,
                filter,
                filterLayerIDs,
                styleLayers
            );

        }
        return result;
    }

    hasLayer(id) {
        for (const layerIDs of this.bucketLayerIDs) {
            for (const layerID of layerIDs) {
                if (id === layerID) return true;
            }
        }

        return false;
    }
}

register(
    'FeatureIndex',
    FeatureIndex,
    { omit: ['rawTileData', 'sourceLayerCoder'] }
);

module.exports = FeatureIndex;

function topDownFeatureComparator(a, b) {
    return b - a;
}
