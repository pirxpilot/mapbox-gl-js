const { register } = require('../util/transfer_registry');

class OpacityState {
  constructor() {
    this.opacity = 0;
    this.targetOpacity = 0;
    this.time = 0;
  }

  clone() {
    const clone = new OpacityState();
    clone.opacity = this.opacity;
    clone.targetOpacity = this.targetOpacity;
    clone.time = this.time;
    return clone;
  }
}

register('OpacityState', OpacityState);

module.exports = OpacityState;
