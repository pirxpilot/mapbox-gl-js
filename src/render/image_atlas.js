'use strict';

const ShelfPack = require('@mapbox/shelf-pack');

const { RGBAImage } = require('../util/image');
const { register } = require('../util/web_worker_transfer');

const padding = 1;

class ImagePosition {

    constructor(paddedRect, {pixelRatio}) {
        this.paddedRect = paddedRect;
        this.pixelRatio = pixelRatio;
    }

    get tl() {
        return [
            this.paddedRect.x + padding,
            this.paddedRect.y + padding
        ];
    }

    get br() {
        return [
            this.paddedRect.x + this.paddedRect.w - padding,
            this.paddedRect.y + this.paddedRect.h - padding
        ];
    }

    get displaySize() {
        return [
            (this.paddedRect.w - padding * 2) / this.pixelRatio,
            (this.paddedRect.h - padding * 2) / this.pixelRatio
        ];
    }
}

class ImageAtlas {

    constructor(images) {
        const image = new RGBAImage({width: 0, height: 0});
        const positions = {};

        const pack = new ShelfPack(0, 0, {autoResize: true});

        for (const id in images) {
            const src = images[id];

            const bin = pack.packOne(
                src.data.width + 2 * padding,
                src.data.height + 2 * padding);

            image.resize({
                width: pack.w,
                height: pack.h
            });

            RGBAImage.copy(
                src.data,
                image,
                { x: 0, y: 0 },
                {
                    x: bin.x + padding,
                    y: bin.y + padding
                },
                src.data);

            positions[id] = new ImagePosition(bin, src);
        }

        pack.shrink();
        image.resize({
            width: pack.w,
            height: pack.h
        });

        this.image = image;
        this.positions = positions;
    }
}

ImageAtlas.ImagePosition = ImagePosition;
module.exports = ImageAtlas;

register('ImagePosition', ImagePosition);
register('ImageAtlas', ImageAtlas);
