'use strict';

const StyleLayer = require('../style_layer');

const HeatmapBucket = require('../../data/bucket/heatmap_bucket');
const properties = require('./heatmap_style_layer_properties');
const renderColorRamp = require('../../util/color_ramp');

class HeatmapStyleLayer extends StyleLayer {



    createBucket(options) {
        return new HeatmapBucket(options);
    }

    constructor(layer) {
        super(layer, properties);

        // make sure color ramp texture is generated for default heatmap color too
        this._updateColorRamp();
    }

    _handleSpecialPaintPropertyUpdate(name) {
        if (name === 'heatmap-color') {
            this._updateColorRamp();
        }
    }

    _updateColorRamp() {
        const expression = this._transitionablePaint._values['heatmap-color'].value.expression;
        this.colorRamp = renderColorRamp(expression, 'heatmapDensity');
        this.colorRampTexture = null;
    }

    resize() {
        if (this.heatmapFbo) {
            this.heatmapFbo.destroy();
            this.heatmapFbo = null;
        }
    }

    queryRadius() {
        return 0;
    }

    queryIntersectsFeature()  {
        return false;
    }

    hasOffscreenPass() {
        return this.paint.get('heatmap-opacity') !== 0 && this.visibility !== 'none';
    }
}

module.exports = HeatmapStyleLayer;
