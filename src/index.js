'use strict';

module.exports = {
    version: require('../package.json').version,
    supported: require('@mapbox/mapbox-gl-supported'),
    setRTLTextPlugin: require('./source/rtl_text_plugin').setRTLTextPlugin,
    Map: require('./ui/map'),
    NavigationControl: require('./ui/control/navigation_control'),
    Style: require('./style/style'),
    LngLat: require('./geo/lng_lat'),
    LngLatBounds: require('./geo/lng_lat_bounds'),
    Point: require('@mapbox/point-geometry'),
    Evented: require('./util/evented').Evented,
    config: require('./util/config'),

    /**
     * Gets and sets the map's [access token](https://www.mapbox.com/help/define-access-token/).
     *
     * @var {string} accessToken
     * @example
     * mapboxgl.accessToken = myAccessToken;
     * @see [Display a map](https://www.mapbox.com/mapbox-gl-js/examples/)
     */
    get accessToken() {
        return this.config.ACCESS_TOKEN;
    },

    set accessToken(token) {
        this.config.ACCESS_TOKEN = token;
    },

    get workerCount() {
        return this.config.WORKER_COUNT;
    },

    set workerCount(count) {
        this.config.WORKER_COUNT = count;
    },

    get workerUrl() {
        return this.config.WORKER_URL;
    },

    set workerUrl(url) {
        this.config.WORKER_URL = url;
    }
};

/**
 * The version of Mapbox GL JS in use as specified in `package.json`,
 * `CHANGELOG.md`, and the GitHub release.
 *
 * @var {string} version
 */

/**
 * Test whether the browser [supports Mapbox GL JS](https://www.mapbox.com/help/mapbox-browser-support/#mapbox-gl-js).
 *
 * @function supported
 * @param {Object} [options]
 * @param {boolean} [options.failIfMajorPerformanceCaveat=false] If `true`,
 *   the function will return `false` if the performance of Mapbox GL JS would
 *   be dramatically worse than expected (e.g. a software WebGL renderer would be used).
 * @return {boolean}
 * @example
 * mapboxgl.supported() // = true
 * @see [Check for browser support](https://www.mapbox.com/mapbox-gl-js/example/check-for-support/)
 */

/**
 * Sets the map's [RTL text plugin](https://www.mapbox.com/mapbox-gl-js/plugins/#mapbox-gl-rtl-text).
 * Necessary for supporting languages like Arabic and Hebrew that are written right-to-left.
 *
 * @function setRTLTextPlugin
 * @param {string} pluginURL URL pointing to the Mapbox RTL text plugin source.
 * @param {Function} callback Called with an error argument if there is an error.
 * @example
 * mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.1.2/mapbox-gl-rtl-text.js');
 * @see [Add support for right-to-left scripts](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-rtl-text/)
 */

// canary assert: used to confirm that asserts have been removed from production build
const assert = require('assert');
assert(true, 'canary assert');
