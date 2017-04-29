'use strict';

const test = require('mapbox-gl-js-test').test;
const window = require('../../../src/util/window');
const Map = require('../../../src/ui/map');
const Marker = require('../../../src/ui/marker');

function createMap() {
    const container = window.document.createElement('div');
    Object.defineProperty(container, 'offsetWidth', {value: 512});
    Object.defineProperty(container, 'offsetHeight', {value: 512});
    return new Map({container: container});
}

test('Marker', (t) => {
    t.test('constructor', (t) => {
        const el = window.document.createElement('div');
        const marker = new Marker(el);
        t.ok(marker.getElement(), 'marker element is created');
        t.end();
    });

    t.test('marker is added to map', (t) => {
        const map = createMap();
        const marker = new Marker(window.document.createElement('div')).setLngLat([-77.01866, 38.888]);
        t.ok(marker.addTo(map) instanceof Marker, 'marker.addTo(map) returns Marker instance');
        t.ok(marker._map, 'marker instance is bound to map instance');
        t.end();
    });

    t.test('marker\'s lngLat can be changed', (t) => {
        const map = createMap();
        const marker = new Marker(window.document.createElement('div')).setLngLat([-77.01866, 38.888]).addTo(map);
        t.ok(marker.setLngLat([-76, 39]) instanceof Marker, 'marker.setLngLat() returns Marker instance');
        const markerLngLat = marker.getLngLat();
        t.ok(markerLngLat.lng === -76 &&  markerLngLat.lat === 39, 'marker\'s position can be updated');
        t.end();
    });

    t.end();
});
