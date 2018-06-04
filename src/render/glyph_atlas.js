'use strict';

const ShelfPack = require('@mapbox/shelf-pack');

const { AlphaImage } = require('../util/image');
const { register } = require('../util/web_worker_transfer');


const padding = 1;



class GlyphAtlas {

    constructor(stacks) {
        const image = new AlphaImage({width: 0, height: 0});
        const positions = {};

        const pack = new ShelfPack(0, 0, {autoResize: true});

        for (const stack in stacks) {
            const glyphs = stacks[stack];
            const stackPositions = positions[stack] = {};

            for (const id in glyphs) {
                const src = glyphs[+id];
                if (src && src.bitmap.width !== 0 && src.bitmap.height !== 0) {
                    const bin = pack.packOne(
                        src.bitmap.width + 2 * padding,
                        src.bitmap.height + 2 * padding);

                    image.resize({
                        width: pack.w,
                        height: pack.h
                    });

                    AlphaImage.copy(
                        src.bitmap,
                        image,
                        {x: 0, y: 0},
                        {
                            x: bin.x + padding,
                            y: bin.y + padding
                        },
                        src.bitmap);

                    stackPositions[id] = {rect: bin, metrics: src.metrics};
                }
            }
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

register('GlyphAtlas', GlyphAtlas);

module.exports = GlyphAtlas;
