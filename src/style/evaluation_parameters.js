const ZoomHistory = require('./zoom_history');
const { isStringInSupportedScript } = require('../util/script_detection');
const { plugin: rtlTextPlugin } = require('../source/rtl_text_plugin');

class EvaluationParameters {
  // "options" may also be another EvaluationParameters to copy, see CrossFadedProperty.possiblyEvaluate
  constructor(zoom, options) {
    this.zoom = zoom;

    if (options) {
      this.now = options.now;
      this.fadeDuration = options.fadeDuration;
      this.zoomHistory = options.zoomHistory;
      this.transition = options.transition;
    } else {
      this.now = 0;
      this.fadeDuration = 0;
      this.zoomHistory = new ZoomHistory();
      this.transition = {};
    }
  }

  isSupportedScript(str) {
    return isStringInSupportedScript(str, rtlTextPlugin.isLoaded());
  }

  crossFadingFactor() {
    if (this.fadeDuration === 0) {
      return 1;
    } else {
      return Math.min((this.now - this.zoomHistory.lastIntegerZoomTime) / this.fadeDuration, 1);
    }
  }
}

module.exports = EvaluationParameters;
