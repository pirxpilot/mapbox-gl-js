'use strict';

const panStep = 100,
    bearingStep = 15,
    pitchStep = 10;

/**
 * The `KeyboardHandler` allows the user to zoom, rotate, and pan the map using
 * the following keyboard shortcuts:
 *
 * - `=` / `+`: Increase the zoom level by 1.
 * - `Shift-=` / `Shift-+`: Increase the zoom level by 2.
 * - `-`: Decrease the zoom level by 1.
 * - `Shift--`: Decrease the zoom level by 2.
 * - Arrow keys: Pan by 100 pixels.
 * - `Shift+⇢`: Increase the rotation by 15 degrees.
 * - `Shift+⇠`: Decrease the rotation by 15 degrees.
 * - `Shift+⇡`: Increase the pitch by 10 degrees.
 * - `Shift+⇣`: Decrease the pitch by 10 degrees.
 */
function keyboardHandler(map) {

    const el = map.getCanvasContainer();

    let enabled = false;

    /**
     * Returns a Boolean indicating whether keyboard interaction is enabled.
     *
     * @returns {boolean} `true` if keyboard interaction is enabled.
     */
    function isEnabled() {
        return enabled;
    }

    /**
     * Enables keyboard interaction.
     *
     * @example
     * map.keyboard.enable();
     */
    function enable() {
        if (enabled) return;
        el.addEventListener('keydown', onKeyDown, false);
        enabled = true;
    }

    /**
     * Disables keyboard interaction.
     *
     * @example
     * map.keyboard.disable();
     */
    function disable() {
        if (!enabled) return;
        el.removeEventListener('keydown', onKeyDown);
        enabled = false;
    }

    function onKeyDown(e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return;

        let zoomDir = 0;
        let bearingDir = 0;
        let pitchDir = 0;
        let xDir = 0;
        let yDir = 0;

        switch (e.keyCode) {
        case 61:
        case 107:
        case 171:
        case 187:
            zoomDir = 1;
            break;

        case 189:
        case 109:
        case 173:
            zoomDir = -1;
            break;

        case 37:
            if (e.shiftKey) {
                bearingDir = -1;
            } else {
                e.preventDefault();
                xDir = -1;
            }
            break;

        case 39:
            if (e.shiftKey) {
                bearingDir = 1;
            } else {
                e.preventDefault();
                xDir = 1;
            }
            break;

        case 38:
            if (e.shiftKey) {
                pitchDir = 1;
            } else {
                e.preventDefault();
                yDir = -1;
            }
            break;

        case 40:
            if (e.shiftKey) {
                pitchDir = -1;
            } else {
                yDir = 1;
                e.preventDefault();
            }
            break;

        default:
            return;
        }

        const zoom = map.getZoom();

        const easeOptions = {
            duration: 300,
            delayEndEvents: 500,
            easing: easeOut,

            zoom: zoomDir ? Math.round(zoom) + zoomDir * (e.shiftKey ? 2 : 1) : zoom,
            bearing: map.getBearing() + bearingDir * bearingStep,
            pitch: map.getPitch() + pitchDir * pitchStep,
            offset: [-xDir * panStep, -yDir * panStep],
            center: map.getCenter()
        };

        map.easeTo(easeOptions, {originalEvent: e});
    }

    return {
        isEnabled,
        enable,
        disable
    };
}

function easeOut(t) {
    return t * (2 - t);
}

module.exports = keyboardHandler;
