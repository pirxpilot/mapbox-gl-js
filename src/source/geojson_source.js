const { Event, ErrorEvent, Evented } = require('../util/evented');

const EXTENT = require('../data/extent');
const browser = require('../util/browser');

/**
 * A source containing GeoJSON.
 * (See the [Style Specification](https://www.mapbox.com/mapbox-gl-style-spec/#sources-geojson) for detailed documentation of options.)
 *
 * @example
 * map.addSource('some id', {
 *     type: 'geojson',
 *     data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_ports.geojson'
 * });
 *
 * @example
 * map.addSource('some id', {
 *    type: 'geojson',
 *    data: {
 *        "type": "FeatureCollection",
 *        "features": [{
 *            "type": "Feature",
 *            "properties": {},
 *            "geometry": {
 *                "type": "Point",
 *                "coordinates": [
 *                    -76.53063297271729,
 *                    39.18174077994108
 *                ]
 *            }
 *        }]
 *    }
 * });
 *
 * @example
 * map.getSource('some id').setData({
 *   "type": "FeatureCollection",
 *   "features": [{
 *       "type": "Feature",
 *       "properties": { "name": "Null Island" },
 *       "geometry": {
 *           "type": "Point",
 *           "coordinates": [ 0, 0 ]
 *       }
 *   }]
 * });
 * @see [Draw GeoJSON points](https://www.mapbox.com/mapbox-gl-js/example/geojson-markers/)
 * @see [Add a GeoJSON line](https://www.mapbox.com/mapbox-gl-js/example/geojson-line/)
 * @see [Create a heatmap from points](https://www.mapbox.com/mapbox-gl-js/example/heatmap/)
 */
class GeoJSONSource extends Evented {
  /**
   * @private
   */
  constructor(id, options, dispatcher, eventedParent) {
    super();

    this.id = id;

    // `type` is a property rather than a constant to make it easy for 3rd
    // parties to use GeoJSONSource to build their own source types.
    this.type = 'geojson';

    this.minzoom = 0;
    this.maxzoom = 18;
    this.tileSize = 512;
    this.isTileClipped = true;
    this.reparseOverscaled = true;
    this._removed = false;

    this.dispatcher = dispatcher;
    this.setEventedParent(eventedParent);

    this._data = options.data;
    this._options = Object.assign({}, options);

    if (options.maxzoom !== undefined) this.maxzoom = options.maxzoom;
    if (options.type) this.type = options.type;

    const scale = EXTENT / this.tileSize;

    // sent to the worker, along with `url: ...` or `data: literal geojson`,
    // so that it can load/parse/index the geojson data
    // extending with `options.workerOptions` helps to make it easy for
    // third-party sources to hack/reuse GeoJSONSource.
    this.workerOptions = Object.assign(
      {
        source: this.id,
        cluster: options.cluster || false,
        geojsonVtOptions: {
          buffer: (options.buffer !== undefined ? options.buffer : 128) * scale,
          tolerance: (options.tolerance !== undefined ? options.tolerance : 0.375) * scale,
          extent: EXTENT,
          maxZoom: this.maxzoom,
          lineMetrics: options.lineMetrics || false
        },
        superclusterOptions: {
          maxZoom:
            options.clusterMaxZoom !== undefined
              ? Math.min(options.clusterMaxZoom, this.maxzoom - 1)
              : this.maxzoom - 1,
          extent: EXTENT,
          radius: (options.clusterRadius || 50) * scale,
          log: false
        }
      },
      options.workerOptions
    );
  }

  async load() {
    try {
      this.fire(new Event('dataloading', { dataType: 'source' }));
      await this._updateWorkerData();
      const data = { dataType: 'source', sourceDataType: 'metadata' };
      // although GeoJSON sources contain no metadata, we fire this event to let the SourceCache
      // know its ok to start requesting tiles.
      this.fire(new Event('data', data));
    } catch (err) {
      this.fire(new ErrorEvent(err));
    }
  }

  onAdd(map) {
    this.map = map;
    this.load();
  }

  /**
   * Sets the GeoJSON data and re-renders the map.
   *
   * @param {Object|string} data A GeoJSON data object or a URL to one. The latter is preferable in the case of large GeoJSON files.
   * @returns {GeoJSONSource} this
   */
  setData(data) {
    this._data = data;
    this.fire(new Event('dataloading', { dataType: 'source' }));
    this._updateWorkerData().then(
      () => {
        const data = { dataType: 'source', sourceDataType: 'content' };
        this.fire(new Event('data', data));
      },
      err => this.fire(new ErrorEvent(err))
    );
    return this;
  }

  /*
   * Responsible for invoking WorkerSource's geojson.loadData target, which
   * handles loading the geojson data and preparing to serve it up as tiles,
   * using geojson-vt or supercluster as appropriate.
   */
  async _updateWorkerData() {
    const data = this._data;
    const json = typeof data === 'function' ? await data().catch(() => {}) : data;
    if (!json) {
      throw new Error('no GeoJSON data');
    }

    const options = {
      ...this.workerOptions,
      data: JSON.stringify(json)
    };
    // target {this.type}.loadData rather than literally geojson.loadData,
    // so that other geojson-like source types can easily reuse this
    // implementation
    this.workerID = this.dispatcher.nextWorkerId(this.workerID);
    const result = await this.dispatcher.send(`${this.type}.loadData`, options, this.workerID);
    if (this._removed || result?.abandoned) {
      return;
    }
    this._loaded = true;

    const resourceTiming = result?.resourceTiming?.[this.id];
    if (resourceTiming) {
      this._resourceTiming = resourceTiming.slice();
    }
    // Any `loadData` calls that piled up while we were processing
    // this one will get coalesced into a single call when this
    // 'coalesce' message is processed.
    // We would self-send from the worker if we had access to its
    // message queue. Waiting instead for the 'coalesce' to round-trip
    // through the foreground just means we're throttling the worker
    // to run at a little less than full-throttle.
    await this.dispatcher.send(`${this.type}.coalesce`, { source: options.source }, this.workerID);
  }

  loadTile(tile, callback) {
    const message = tile.workerID === undefined ? 'loadTile' : 'reloadTile';
    const params = {
      type: this.type,
      uid: tile.uid,
      tileID: tile.tileID,
      zoom: tile.tileID.overscaledZ,
      maxZoom: this.maxzoom,
      tileSize: this.tileSize,
      source: this.id,
      pixelRatio: browser.devicePixelRatio,
      showCollisionBoxes: this.map.showCollisionBoxes
    };

    this.workerID = this.dispatcher.nextWorkerId(this.workerID);
    this.dispatcher.send(message, params).then(
      data => {
        tile.unloadVectorData();
        if (!tile.aborted) {
          tile.loadVectorData(data, this.map.painter, message === 'reloadTile');
        }
        callback();
      },
      err => {
        tile.unloadVectorData();
        callback(err);
      }
    );
  }

  abortTile(tile) {
    tile.aborted = true;
  }

  unloadTile(tile) {
    tile.unloadVectorData();
    return this.dispatcher.send('removeTile', { uid: tile.uid, type: this.type, source: this.id }, tile.workerID);
  }

  onRemove() {
    this._removed = true;
    return this.dispatcher.send('removeSource', { type: this.type, source: this.id }, this.workerID);
  }

  serialize() {
    return Object.assign({}, this._options, {
      type: this.type,
      data: this._data
    });
  }

  hasTransition() {
    return false;
  }
}

module.exports = GeoJSONSource;
