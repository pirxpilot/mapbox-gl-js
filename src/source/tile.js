const cacheControl = require('../util/cache_control');
const { deepEqual } = require('../util/object');
const uniqueId = require('../util/unique_id');
const { deserialize: deserializeBucket } = require('../data/bucket');
const GeoJSONFeature = require('../util/vectortile_to_geojson');
const featureFilter = require('../style-spec/feature_filter');
const SymbolBucket = require('../data/bucket/symbol_bucket');
const { RasterBoundsArray, CollisionBoxArray } = require('../data/array_types');
const rasterBoundsAttributes = require('../data/raster_bounds_attributes');
const EXTENT = require('../data/extent');
const Point = require('@mapbox/point-geometry');
const Texture = require('../render/texture');
const SegmentVector = require('../data/segment');
const { TriangleIndexArray } = require('../data/index_array_type');
const browser = require('../util/browser');
const EvaluationParameters = require('../style/evaluation_parameters');

const CLOCK_SKEW_RETRY_TIMEOUT = 30000;

/* Tile data was previously loaded, but has expired per its
 * HTTP headers and is in the process of refreshing. */

/**
 * A tile object is the combination of a Coordinate, which defines
 * its place, as well as a unique ID and data tracking for its content
 *
 * @private
 */
class Tile {
  /**
   * @param {OverscaledTileID} tileID
   * @param size
   */
  constructor(tileID, size) {
    this.tileID = tileID;
    this.uid = uniqueId();
    this.uses = 0;
    this.tileSize = size;
    this.buckets = {};
    this.expirationTime = null;
    this.queryPadding = 0;
    this.hasSymbolBuckets = false;

    // Counts the number of times a response was already expired when
    // received. We're using this to add a delay when making a new request
    // so we don't have to keep retrying immediately in case of a server
    // serving expired tiles.
    this.expiredRequestCount = 0;

    this.state = 'loading';
  }

  registerFadeDuration(duration) {
    const fadeEndTime = duration + this.timeAdded;
    if (fadeEndTime < browser.now()) return;
    if (this.fadeEndTime && fadeEndTime < this.fadeEndTime) return;

    this.fadeEndTime = fadeEndTime;
  }

  wasRequested() {
    return this.state === 'errored' || this.state === 'loaded' || this.state === 'reloading';
  }

  /**
   * Given a data object with a 'buffers' property, load it into
   * this tile's elementGroups and buffers properties and set loaded
   * to true. If the data is null, like in the case of an empty
   * GeoJSON tile, no-op but still set loaded to true.
   * @param {Object} data
   * @param painter
   * @returns {undefined}
   */
  loadVectorData(data, painter, justReloaded) {
    if (this.hasData()) {
      this.unloadVectorData();
    }

    this.state = 'loaded';

    // empty GeoJSON tile
    if (!data) {
      this.collisionBoxArray = new CollisionBoxArray();
      return;
    }

    if (data.featureIndex) {
      this.latestFeatureIndex = data.featureIndex;
      if (data.rawTileData) {
        // Only vector tiles have rawTileData, and they won't update it for
        // 'reloadTile'
        this.latestRawTileData = data.rawTileData;
        this.latestFeatureIndex.rawTileData = data.rawTileData;
      } else if (this.latestRawTileData) {
        // If rawTileData hasn't updated, hold onto a pointer to the last
        // one we received
        this.latestFeatureIndex.rawTileData = this.latestRawTileData;
      }
    }
    this.collisionBoxArray = data.collisionBoxArray;
    this.buckets = deserializeBucket(data.buckets, painter.style);

    this.hasSymbolBuckets = false;
    const buckets = Object.values(this.buckets);
    for (const bucket of buckets) {
      if (bucket instanceof SymbolBucket) {
        this.hasSymbolBuckets = true;
        if (justReloaded) {
          bucket.justReloaded = true;
        } else {
          break;
        }
      }
    }

    this.queryPadding = 0;
    for (const bucket of buckets) {
      this.queryPadding = Math.max(this.queryPadding, painter.style.getLayer(bucket.layerIds[0]).queryRadius(bucket));
    }

    if (data.iconAtlasImage) {
      this.iconAtlasImage = data.iconAtlasImage;
    }
    if (data.glyphAtlasImage) {
      this.glyphAtlasImage = data.glyphAtlasImage;
    }
  }

  /**
   * Release any data or WebGL resources referenced by this tile.
   * @returns {undefined}
   * @private
   */
  unloadVectorData() {
    for (const bucket of Object.values(this.buckets)) {
      bucket.destroy();
    }
    this.buckets = {};

    this.iconAtlasTexture?.destroy();
    this.glyphAtlasTexture?.destroy();
    this.latestFeatureIndex = null;
    this.state = 'unloaded';
  }

  unloadDEMData() {
    this.dem = null;
    this.neighboringTiles = null;
    this.state = 'unloaded';
  }

  getBucket(layer) {
    return this.buckets[layer.id];
  }

  upload(context) {
    for (const id in this.buckets) {
      const bucket = this.buckets[id];
      if (bucket.uploadPending()) {
        bucket.upload(context);
      }
    }

    const gl = context.gl;

    if (this.iconAtlasImage) {
      this.iconAtlasTexture = new Texture(context, this.iconAtlasImage, gl.RGBA);
      this.iconAtlasImage = null;
    }

    if (this.glyphAtlasImage) {
      this.glyphAtlasTexture = new Texture(context, this.glyphAtlasImage, gl.ALPHA);
      this.glyphAtlasImage = null;
    }
  }

  // Queries non-symbol features rendered for this tile.
  // Symbol features are queried globally
  queryRenderedFeatures(
    layers,
    sourceFeatureState,
    queryGeometry,
    scale,
    params,
    transform,
    maxPitchScaleFactor,
    posMatrix
  ) {
    if (!this.latestFeatureIndex?.rawTileData) return {};

    return this.latestFeatureIndex.query(
      {
        queryGeometry: queryGeometry,
        scale: scale,
        tileSize: this.tileSize,
        posMatrix: posMatrix,
        transform: transform,
        params: params,
        queryPadding: this.queryPadding * maxPitchScaleFactor
      },
      layers,
      sourceFeatureState
    );
  }

  querySourceFeatures(result, params) {
    if (!this.latestFeatureIndex?.rawTileData) return;

    const vtLayers = this.latestFeatureIndex.loadVTLayers();

    const sourceLayer = params ? params.sourceLayer : '';
    const layer = vtLayers._geojsonTileLayer || vtLayers[sourceLayer];

    if (!layer) return;

    const filter = featureFilter(params?.filter);
    const { z, x, y } = this.tileID.canonical;
    const coord = { z, x, y };

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      if (filter(new EvaluationParameters(this.tileID.overscaledZ), feature)) {
        const geojsonFeature = new GeoJSONFeature(feature, z, x, y);
        geojsonFeature.tile = coord;
        result.push(geojsonFeature);
      }
    }
  }

  clearMask() {
    if (this.segments) {
      this.segments.destroy();
      delete this.segments;
    }
    if (this.maskedBoundsBuffer) {
      this.maskedBoundsBuffer.destroy();
      delete this.maskedBoundsBuffer;
    }
    if (this.maskedIndexBuffer) {
      this.maskedIndexBuffer.destroy();
      delete this.maskedIndexBuffer;
    }
  }

  setMask(mask, context) {
    // don't redo buffer work if the mask is the same;
    if (deepEqual(this.mask, mask)) return;

    this.mask = mask;
    this.clearMask();

    // We want to render the full tile, and keeping the segments/vertices/indices empty means
    // using the global shared buffers for covering the entire tile.
    if (deepEqual(mask, { 0: true })) return;

    const maskedBoundsArray = new RasterBoundsArray();
    const indexArray = new TriangleIndexArray();

    this.segments = new SegmentVector();
    // Create a new segment so that we will upload (empty) buffers even when there is nothing to
    // draw for this tile.
    this.segments.prepareSegment(0, maskedBoundsArray, indexArray);

    const maskArray = Object.keys(mask);
    for (let i = 0; i < maskArray.length; i++) {
      const maskCoord = mask[maskArray[i]];
      const vertexExtent = EXTENT >> maskCoord.z;
      const tlVertex = new Point(maskCoord.x * vertexExtent, maskCoord.y * vertexExtent);
      const brVertex = new Point(tlVertex.x + vertexExtent, tlVertex.y + vertexExtent);

      // not sure why flow is complaining here because it doesn't complain at L401
      const segment = this.segments.prepareSegment(4, maskedBoundsArray, indexArray);

      maskedBoundsArray.emplaceBack(tlVertex.x, tlVertex.y, tlVertex.x, tlVertex.y);
      maskedBoundsArray.emplaceBack(brVertex.x, tlVertex.y, brVertex.x, tlVertex.y);
      maskedBoundsArray.emplaceBack(tlVertex.x, brVertex.y, tlVertex.x, brVertex.y);
      maskedBoundsArray.emplaceBack(brVertex.x, brVertex.y, brVertex.x, brVertex.y);

      const offset = segment.vertexLength;
      // 0, 1, 2
      // 1, 2, 3
      indexArray.emplaceBack(offset, offset + 1, offset + 2);
      indexArray.emplaceBack(offset + 1, offset + 2, offset + 3);

      segment.vertexLength += 4;
      segment.primitiveLength += 2;
    }

    this.maskedBoundsBuffer = context.createVertexBuffer(maskedBoundsArray, rasterBoundsAttributes.members);
    this.maskedIndexBuffer = context.createIndexBuffer(indexArray);
  }

  hasData() {
    return this.state === 'loaded' || this.state === 'reloading' || this.state === 'expired';
  }

  setExpiryData(data) {
    const prior = this.expirationTime;

    if (data.cacheControl) {
      const parsedCC = cacheControl.parse(data.cacheControl);
      if (parsedCC['max-age']) this.expirationTime = Date.now() + parsedCC['max-age'] * 1000;
    } else if (data.expires) {
      this.expirationTime = new Date(data.expires).getTime();
    }

    if (this.expirationTime) {
      const now = Date.now();
      let isExpired = false;

      if (this.expirationTime > now) {
        isExpired = false;
      } else if (!prior) {
        isExpired = true;
      } else if (this.expirationTime < prior) {
        // Expiring date is going backwards:
        // fall back to exponential backoff
        isExpired = true;
      } else {
        const delta = this.expirationTime - prior;

        if (!delta) {
          // Server is serving the same expired resource over and over: fall
          // back to exponential backoff.
          isExpired = true;
        } else {
          // Assume that either the client or the server clock is wrong and
          // try to interpolate a valid expiration date (from the client POV)
          // observing a minimum timeout.
          this.expirationTime = now + Math.max(delta, CLOCK_SKEW_RETRY_TIMEOUT);
        }
      }

      if (isExpired) {
        this.expiredRequestCount++;
        this.state = 'expired';
      } else {
        this.expiredRequestCount = 0;
      }
    }
  }

  getExpiryTimeout() {
    if (this.expirationTime) {
      if (this.expiredRequestCount) {
        return 1000 * (1 << Math.min(this.expiredRequestCount - 1, 31));
      }
      // Max value for `setTimeout` implementations is a 32 bit integer; cap this accordingly
      return Math.min(this.expirationTime - new Date().getTime(), 2 ** 31 - 1);
    }
  }

  setFeatureState(states, painter) {
    if (!this.latestFeatureIndex?.rawTileData || Object.keys(states).length === 0) {
      return;
    }

    const vtLayers = this.latestFeatureIndex.loadVTLayers();

    for (const i in this.buckets) {
      const bucket = this.buckets[i];
      // Buckets are grouped by common source-layer
      const sourceLayerId = bucket.layers[0]['sourceLayer'] || '_geojsonTileLayer';
      const sourceLayer = vtLayers[sourceLayerId];
      const sourceLayerStates = states[sourceLayerId];
      if (!sourceLayer || !sourceLayerStates || Object.keys(sourceLayerStates).length === 0) continue;

      bucket.update(sourceLayerStates, sourceLayer);
      if (painter?.style) {
        this.queryPadding = Math.max(this.queryPadding, painter.style.getLayer(bucket.layerIds[0]).queryRadius(bucket));
      }
    }
  }

  holdingForFade() {
    return this.symbolFadeHoldUntil !== undefined;
  }

  symbolFadeFinished() {
    return !this.symbolFadeHoldUntil || this.symbolFadeHoldUntil < browser.now();
  }

  clearFadeHold() {
    this.symbolFadeHoldUntil = undefined;
  }

  setHoldDuration(duration) {
    this.symbolFadeHoldUntil = browser.now() + duration;
  }
}

module.exports = Tile;
