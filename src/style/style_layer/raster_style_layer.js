'use strict';

const StyleLayer = require('../style_layer');

const properties = require('./raster_style_layer_properties');


class RasterStyleLayer extends StyleLayer {

    constructor(layer) {
        super(layer, properties);
    }
}

module.exports = RasterStyleLayer;
