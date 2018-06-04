'use strict';

const Point = require('@mapbox/point-geometry');

const { register } = require('../util/web_worker_transfer');

class Anchor extends Point {

    constructor(x, y, angle, segment) {
        super(x, y);
        this.angle = angle;
        if (segment !== undefined) {
            this.segment = segment;
        }
    }

    clone() {
        return new Anchor(this.x, this.y, this.angle, this.segment);
    }
}

register('Anchor', Anchor);

module.exports = Anchor;
