'use strict';

const { Event } = require('../util/evented');

const DOM = require('../util/dom');
const Point = require('@mapbox/point-geometry');
const { extend } = require('../util/util');


/**
 * `MapMouseEvent` is the event type for mouse-related map events.
 * @extends {Object}
 */
class MapMouseEvent extends Event {
    /**
     * The event type.
     */

    /**
     * The `Map` object that fired the event.
     */

    /**
     * The DOM event which caused the map event.
     */

    /**
     * The pixel coordinates of the mouse cursor, relative to the map and measured from the top left corner.
     */

    /**
     * The geographic location on the map of the mouse cursor.
     */

    /**
     * Prevents subsequent default processing of the event by the map.
     *
     * Calling this method will prevent the following default map behaviors:
     *
     *   * On `mousedown` events, the behavior of {@link DragPanHandler}
     *   * On `mousedown` events, the behavior of {@link DragRotateHandler}
     *   * On `mousedown` events, the behavior of {@link BoxZoomHandler}
     *   * On `dblclick` events, the behavior of {@link DoubleClickZoomHandler}
     *
     */
    preventDefault() {
        this._defaultPrevented = true;
    }

    /**
     * `true` if `preventDefault` has been called.
     */
    get defaultPrevented() {
        return this._defaultPrevented;
    }


    /**
     * @private
     */
    constructor(type, map, originalEvent, data = {}) {
        const point = DOM.mousePos(map.getCanvasContainer(), originalEvent);
        const lngLat = map.unproject(point);
        super(type, extend({ point, lngLat, originalEvent }, data));
        this._defaultPrevented = false;
        this.target = map;
    }
}

/**
 * `MapTouchEvent` is the event type for touch-related map events.
 * @extends {Object}
 */
class MapTouchEvent extends Event {
    /**
     * The event type.
     */

    /**
     * The `Map` object that fired the event.
     */

    /**
     * The DOM event which caused the map event.
     */

    /**
     * The geographic location on the map of the center of the touch event points.
     */

    /**
     * The pixel coordinates of the center of the touch event points, relative to the map and measured from the top left
     * corner.
     */

    /**
     * The array of pixel coordinates corresponding to a
     * [touch event's `touches`](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/touches) property.
     */

    /**
     * The geographical locations on the map corresponding to a
     * [touch event's `touches`](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/touches) property.
     */

    /**
     * Prevents subsequent default processing of the event by the map.
     *
     * Calling this method will prevent the following default map behaviors:
     *
     *   * On `touchstart` events, the behavior of {@link DragPanHandler}
     *   * On `touchstart` events, the behavior of {@link TouchZoomRotateHandler}
     *
     */
    preventDefault() {
        this._defaultPrevented = true;
    }

    /**
     * `true` if `preventDefault` has been called.
     */
    get defaultPrevented() {
        return this._defaultPrevented;
    }


    /**
     * @private
     */
    constructor(type, map, originalEvent) {
        const points = DOM.touchPos(map.getCanvasContainer(), originalEvent);
        const lngLats = points.map((t) => map.unproject(t));
        const point = points.reduce((prev, curr, i, arr) => {
            return prev.add(curr.div(arr.length));
        }, new Point(0, 0));
        const lngLat = map.unproject(point);
        super(type, { points, point, lngLats, lngLat, originalEvent });
        this._defaultPrevented = false;
    }
}


/**
 * `MapWheelEvent` is the event type for the `wheel` map event.
 * @extends {Object}
 */
class MapWheelEvent extends Event {
    /**
     * The event type.
     */

    /**
     * The `Map` object that fired the event.
     */

    /**
     * The DOM event which caused the map event.
     */

    /**
     * Prevents subsequent default processing of the event by the map.
     *
     * Calling this method will prevent the the behavior of {@link ScrollZoomHandler}.
     */
    preventDefault() {
        this._defaultPrevented = true;
    }

    /**
     * `true` if `preventDefault` has been called.
     */
    get defaultPrevented() {
        return this._defaultPrevented;
    }


    /**
     * @private
     */
    constructor(type, map, originalEvent) {
        super(type, { originalEvent });
        this._defaultPrevented = false;
    }
}

module.exports = {
    MapMouseEvent,
    MapTouchEvent,
    MapWheelEvent
};

/**
 * @typedef {Object} MapBoxZoomEvent
 * @property {MouseEvent} originalEvent
 * @property {LngLatBounds} boxZoomBounds The bounding box of the "box zoom" interaction.
 *   This property is only provided for `boxzoomend` events.
 */

/**
 * A `MapDataEvent` object is emitted with the {@link Map.event:data}
 * and {@link Map.event:dataloading} events. Possible values for
 * `dataType`s are:
 *
 * - `'source'`: The non-tile data associated with any source
 * - `'style'`: The [style](https://www.mapbox.com/mapbox-gl-style-spec/) used by the map
 *
 * @typedef {Object} MapDataEvent
 * @property {string} type The event type.
 * @property {string} dataType The type of data that has changed. One of `'source'`, `'style'`.
 * @property {boolean} [isSourceLoaded] True if the event has a `dataType` of `source` and the source has no outstanding network requests.
 * @property {Object} [source] The [style spec representation of the source](https://www.mapbox.com/mapbox-gl-style-spec/#sources) if the event has a `dataType` of `source`.
 * @property {string} [sourceDataType] Included if the event has a `dataType` of `source` and the event signals
 * that internal data has been received or changed. Possible values are `metadata` and `content`.
 * @property {Object} [tile] The tile being loaded or changed, if the event has a `dataType` of `source` and
 * the event is related to loading of a tile.
 * @property {Coordinate} [coord] The coordinate of the tile if the event has a `dataType` of `source` and
 * the event is related to loading of a tile.
 */


