const FeatureIndex = require('../data/feature_index');

const { performSymbolLayout } = require('../symbol/symbol_layout');
const { CollisionBoxArray } = require('../data/array_types');
const DictionaryCoder = require('../util/dictionary_coder');
const SymbolBucket = require('../data/bucket/symbol_bucket');
const { mapObject, values } = require('../util/object');
const warn = require('../util/warn');
const assert = require('assert');
const ImageAtlas = require('../render/image_atlas');
const GlyphAtlas = require('../render/glyph_atlas');
const EvaluationParameters = require('../style/evaluation_parameters');
const { OverscaledTileID } = require('./tile_id');

class WorkerTile {
  constructor(params) {
    this.tileID = new OverscaledTileID(
      params.tileID.overscaledZ,
      params.tileID.wrap,
      params.tileID.canonical.z,
      params.tileID.canonical.x,
      params.tileID.canonical.y
    );
    this.uid = params.uid;
    this.zoom = params.zoom;
    this.pixelRatio = params.pixelRatio;
    this.tileSize = params.tileSize;
    this.source = params.source;
    this.overscaling = this.tileID.overscaleFactor();
    this.showCollisionBoxes = params.showCollisionBoxes;
  }

  parse(data, layerIndex, actor, callback) {
    this.status = 'parsing';
    this.data = data;

    this.collisionBoxArray = new CollisionBoxArray();
    const sourceLayerCoder = new DictionaryCoder(Object.keys(data.layers).sort());

    const featureIndex = new FeatureIndex(this.tileID);
    featureIndex.bucketLayerIDs = [];

    const buckets = {};

    const options = {
      featureIndex,
      iconDependencies: {},
      glyphDependencies: {}
    };

    const layerFamilies = layerIndex.familiesBySource[this.source];
    for (const sourceLayerId in layerFamilies) {
      const sourceLayer = data.layers[sourceLayerId];
      if (!sourceLayer) {
        continue;
      }

      if (sourceLayer.version === 1) {
        warn.once(
          `Vector tile source "${this.source}" layer "${sourceLayerId}" ` +
            'does not use vector tile spec v2 and therefore may have some rendering errors.'
        );
      }

      const sourceLayerIndex = sourceLayerCoder.encode(sourceLayerId);
      const features = [];
      for (let index = 0; index < sourceLayer.length; index++) {
        const feature = sourceLayer.feature(index);
        features.push({ feature, index, sourceLayerIndex });
      }

      for (const family of layerFamilies[sourceLayerId]) {
        const layer = family[0];

        assert(layer.source === this.source);
        if (layer.minzoom && this.zoom < Math.floor(layer.minzoom)) continue;
        if (layer.maxzoom && this.zoom >= layer.maxzoom) continue;
        if (layer.visibility === 'none') continue;

        recalculateLayers(family, this.zoom);

        const bucket = (buckets[layer.id] = layer.createBucket({
          index: featureIndex.bucketLayerIDs.length,
          layers: family,
          zoom: this.zoom,
          pixelRatio: this.pixelRatio,
          overscaling: this.overscaling,
          collisionBoxArray: this.collisionBoxArray,
          sourceLayerIndex: sourceLayerIndex,
          sourceID: this.source
        }));

        bucket.populate(features, options);
        featureIndex.bucketLayerIDs.push(family.map(l => l.id));
      }
    }

    let error;
    let glyphMap;
    let imageMap;

    const stacks = mapObject(options.glyphDependencies, glyphs => Object.keys(glyphs).map(Number));
    if (Object.keys(stacks).length) {
      actor.send('getGlyphs', { uid: this.uid, stacks }, (err, result) => {
        if (!error) {
          error = err;
          glyphMap = result;
          maybePrepare.call(this);
        }
      });
    } else {
      glyphMap = {};
    }

    const icons = Object.keys(options.iconDependencies);
    if (icons.length) {
      actor.send('getImages', { icons }, (err, result) => {
        if (!error) {
          error = err;
          imageMap = result;
          maybePrepare.call(this);
        }
      });
    } else {
      imageMap = {};
    }

    maybePrepare.call(this);

    function maybePrepare() {
      if (error) {
        return callback(error);
      }
      if (glyphMap && imageMap) {
        const glyphAtlas = new GlyphAtlas(glyphMap);
        const imageAtlas = new ImageAtlas(imageMap);

        for (const key in buckets) {
          const bucket = buckets[key];
          if (bucket instanceof SymbolBucket) {
            recalculateLayers(bucket.layers, this.zoom);
            performSymbolLayout(
              bucket,
              glyphMap,
              glyphAtlas.positions,
              imageMap,
              imageAtlas.positions,
              this.showCollisionBoxes
            );
          }
        }

        this.status = 'done';

        callback(null, {
          buckets: values(buckets).filter(b => !b.isEmpty()),
          featureIndex,
          collisionBoxArray: this.collisionBoxArray,
          glyphAtlasImage: glyphAtlas.image,
          iconAtlasImage: imageAtlas.image
        });
      }
    }
  }
}

function recalculateLayers(layers, zoom) {
  // Layers are shared and may have been used by a WorkerTile with a different zoom.
  const parameters = new EvaluationParameters(zoom);
  for (const layer of layers) {
    layer.recalculate(parameters);
  }
}

module.exports = WorkerTile;
