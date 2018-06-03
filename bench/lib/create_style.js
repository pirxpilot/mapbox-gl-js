'use strict';

const Style = require('../../src/style/style');

const { Evented } = require('../../src/util/evented');

class StubMap extends Evented {
}

module.exports = function (styleJSON) {
    return new Promise((resolve, reject) => {
        const style = new Style(new StubMap());
        style.loadJSON(styleJSON);

        style
            .on('style.load', () => resolve(style))
            .on('error', reject);
    });
};
