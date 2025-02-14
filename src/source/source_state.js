'use strict';

/**
 * SourceFeatureState manages the state and state changes
 * to features in a source, separated by source layer.
 *
 * @private
 */
class SourceFeatureState {
  constructor() {
    this.state = {};
    this.stateChanges = {};
  }

  updateState(sourceLayer, feature, state) {
    feature = String(feature);
    this.stateChanges[sourceLayer] = this.stateChanges[sourceLayer] || {};
    this.stateChanges[sourceLayer][feature] = this.stateChanges[sourceLayer][feature] || {};
    Object.assign(this.stateChanges[sourceLayer][feature], state);
  }

  getState(sourceLayer, feature) {
    feature = String(feature);
    const base = this.state[sourceLayer] || {};
    const changes = this.stateChanges[sourceLayer] || {};
    return Object.assign({}, base[feature], changes[feature]);
  }

  initializeTileState(tile, painter) {
    tile.setFeatureState(this.state, painter);
  }

  coalesceChanges(tiles, painter) {
    const changes = {};
    for (const sourceLayer in this.stateChanges) {
      this.state[sourceLayer] = this.state[sourceLayer] || {};
      const layerStates = {};
      for (const id in this.stateChanges[sourceLayer]) {
        if (!this.state[sourceLayer][id]) {
          this.state[sourceLayer][id] = {};
        }
        Object.assign(this.state[sourceLayer][id], this.stateChanges[sourceLayer][id]);
        layerStates[id] = this.state[sourceLayer][id];
      }
      changes[sourceLayer] = layerStates;
    }
    this.stateChanges = {};
    if (Object.keys(changes).length === 0) return;

    for (const id in tiles) {
      const tile = tiles[id];
      tile.setFeatureState(changes, painter);
    }
  }
}

module.exports = SourceFeatureState;
