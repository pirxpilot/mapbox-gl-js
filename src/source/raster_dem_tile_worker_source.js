const DEMData = require('../data/dem_data');

class RasterDEMTileWorkerSource {
  constructor() {
    this.loaded = {};
  }

  loadTile(params, callback) {
    const { uid, encoding, rawImageData } = params;
    const dem = new DEMData(uid, rawImageData, encoding);

    this.loaded = this.loaded || {};
    this.loaded[uid] = dem;
    callback(null, dem);
  }

  removeTile(params) {
    const loaded = this.loaded,
      uid = params.uid;
    if (loaded?.[uid]) {
      delete loaded[uid];
    }
  }
}

module.exports = RasterDEMTileWorkerSource;
