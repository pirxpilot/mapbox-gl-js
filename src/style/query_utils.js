'use strict';

const Point = require('@mapbox/point-geometry');

module.exports = {
    getMaximumPaintValue,
    translateDistance,
    translate
};

function getMaximumPaintValue(property, layer, bucket) {
    const value = ((layer.paint).get(property)).value;
    if (value.kind === 'constant') {
        return value.value;
    } else {
        const binders = bucket.programConfigurations.get(layer.id).binders;
        return binders[property].maxValue;
    }
}

function translateDistance(translate) {
    return Math.sqrt(translate[0] * translate[0] + translate[1] * translate[1]);
}

function translate(queryGeometry,
                   translate,
                   translateAnchor,
                   bearing,
                   pixelsToTileUnits) {
    if (!translate[0] && !translate[1]) {
        return queryGeometry;
    }

    const pt = Point.convert(translate);

    if (translateAnchor === "viewport") {
        pt._rotate(-bearing);
    }

    const translated = [];
    for (let i = 0; i < queryGeometry.length; i++) {
        const ring = queryGeometry[i];
        const translatedRing = [];
        for (let k = 0; k < ring.length; k++) {
            translatedRing.push(ring[k].sub(pt._mult(pixelsToTileUnits)));
        }
        translated.push(translatedRing);
    }
    return translated;
}
