'use strict';

const config = require('../util/config');
const Evented = require('../util/evented');
const object = require('../util/object');
const loadTileJSON = require('./load_tilejson');
const normalizeURL = require('../util/mapbox').normalizeTileURL;
const TileBounds = require('./tile_bounds');

class VectorTileSource extends Evented {

    constructor(id, options, dispatcher, eventedParent) {
        super();
        this.id = id;
        this.dispatcher = dispatcher;

        this.type = 'vector';
        this.minzoom = 0;
        this.maxzoom = 22;
        this.scheme = 'xyz';
        this.tileSize = 512;
        this.reparseOverscaled = true;
        this.isTileClipped = true;
        Object.assign(this, object.pick(options, ['url', 'scheme', 'tileSize']));

        this._options = Object.assign({ type: 'vector' }, options);

        if (this.tileSize !== 512) {
            throw new Error('vector tile sources must have a tileSize of 512');
        }

        config.on('change', c => this.setLoaderStrategy(c.TILE_LOADER_STRATEGY));

        this.setEventedParent(eventedParent);
    }

    load() {
        this.fire('dataloading', {dataType: 'source'});

        loadTileJSON(this._options, (err, tileJSON) => {
            if (err) {
                this.fire('error', err);
                return;
            }
            Object.assign(this, tileJSON);
            this.setBounds(tileJSON.bounds);

             // `content` is included here to prevent a race condition where `Style#_updateSources` is called
            // before the TileJSON arrives. this makes sure the tiles needed are loaded once TileJSON arrives
            // ref: https://github.com/mapbox/mapbox-gl-js/pull/4347#discussion_r104418088
            this.fire('data', {dataType: 'source', sourceDataType: 'metadata'});
            this.fire('data', {dataType: 'source', sourceDataType: 'content'});

        });
    }

    setBounds(bounds) {
        this.bounds = bounds;
        if (bounds) {
            this.tileBounds = new TileBounds(bounds, this.minzoom, this.maxzoom);
        }
    }

    hasTile(coord) {
        return !this.tileBounds || this.tileBounds.contains(coord, this.maxzoom);
    }

    onAdd(map) {
        this.load();
        this.map = map;
    }

    serialize() {
        return Object.assign({}, this._options);
    }

    loadTile(tile, callback) {
        const overscaling = tile.coord.z > this.maxzoom ? Math.pow(2, tile.coord.z - this.maxzoom) : 1;
        const params = {
            url: normalizeURL(tile.coord.url(this.tiles, this.maxzoom, this.scheme), this.url),
            uid: tile.uid,
            coord: tile.coord,
            zoom: tile.coord.z,
            tileSize: this.tileSize * overscaling,
            type: this.type,
            source: this.id,
            overscaling: overscaling,
            angle: this.map.transform.angle,
            pitch: this.map.transform.pitch,
            showCollisionBoxes: this.map.showCollisionBoxes
        };

        if (!tile.workerID || tile.state === 'expired') {
            tile.workerID = this.dispatcher.send('loadTile', params, done.bind(this));
        } else if (tile.state === 'loading') {
            // schedule tile reloading after it has been loaded
            tile.reloadCallback = callback;
        } else {
            this.dispatcher.send('reloadTile', params, done.bind(this), tile.workerID);
        }

        function done(err, data) {
            if (tile.aborted)
                return;

            if (err) {
                return callback(err);
            }

            if (this.map._refreshExpiredTiles) tile.setExpiryData(data);
            tile.loadVectorData(data, this.map.painter);

            if (tile.redoWhenDone) {
                tile.redoWhenDone = false;
                tile.redoPlacement(this);
            }

            callback(null);

            if (tile.reloadCallback) {
                this.loadTile(tile, tile.reloadCallback);
                tile.reloadCallback = null;
            }
        }
    }

    abortTile(tile) {
        this.dispatcher.send('abortTile', { uid: tile.uid, type: this.type, source: this.id }, null, tile.workerID);
    }

    unloadTile(tile) {
        tile.unloadVectorData();
        this.dispatcher.send('removeTile', { uid: tile.uid, type: this.type, source: this.id }, null, tile.workerID);
    }

    setLoaderStrategy(strategy) {
        this.dispatcher.broadcast('vector.setLoaderStrategy', strategy);
    }
}

module.exports = VectorTileSource;
