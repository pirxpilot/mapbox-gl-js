'use strict';

const { pick } = require('../util/object');
const browser = require('../util/browser');

module.exports = function(options, callback) {
    function loaded(err, tileJSON) {
        if (err) return callback(err);
        if (tileJSON) {
            const { resourceSets } = tileJSON;
            if (resourceSets) {
                if (!resourceSets.length) {
                    return callback('expected resources');
                }
                const { resources } = resourceSets[0];
                if (!(resources && resources.length)) {
                    return callback('expected resources');
                }
                const { imageUrl, imageUrlSubdomains } = resources[0];
                const result = Object.assign({
                    tiles: imageUrlSubdomains.map(sub => imageUrl.replace('{subdomain}', sub).replace('http:', 'https:'))
                }, options);
                delete result.url;
                return callback(null, result);
            }
            const result = pick(
                tileJSON,
                ['tiles', 'minzoom', 'maxzoom', 'attribution', 'mapbox_logo', 'bounds']
            );

            if (tileJSON.vector_layers) {
                result.vectorLayers = tileJSON.vector_layers;
                result.vectorLayerIds = result.vectorLayers.map(layer => layer.id);
            }

            callback(null, result);
        }
    }

    // expects already loaded object, `url` property is ignored
    browser.frame(() => loaded(null, options));
};
