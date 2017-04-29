const { test } = require('mapbox-gl-js-test');
const window = require('../../../src/util/window');
const Map = require('../../../src/ui/map');
const Marker = require('../../../src/ui/marker');
const LngLat = require('../../../src/geo/lng_lat');
const Point = require('@mapbox/point-geometry');
const simulate = require('mapbox-gl-js-test/simulate_interaction');

function createMap() {
    const container = window.document.createElement('div');
    Object.defineProperty(container, 'offsetWidth', {value: 512});
    Object.defineProperty(container, 'offsetHeight', {value: 512});
    return new Map({container: container});
}

test('Marker uses a default marker element with an appropriate offset', (t) => {
    const marker = new Marker();
    t.ok(marker.getElement());
    t.ok(marker.getOffset().equals(new Point(0, -14)));
    t.end();
});

test('Marker uses a default marker element with custom color', (t) => {
    const marker = new Marker({ color: '#123456' });
    t.ok(marker.getElement().innerHTML.includes('#123456'));
    t.end();
});

test('Marker uses a default marker with custom offset', (t) => {
    const marker = new Marker({ offset: [1, 2] });
    t.ok(marker.getElement());
    t.ok(marker.getOffset().equals(new Point(1, 2)));
    t.end();
});

test('Marker uses the provided element', (t) => {
    const element = window.document.createElement('div');
    const marker = new Marker({element});
    t.equal(marker.getElement(), element);
    t.end();
});

test('Marker#addTo adds the marker element to the canvas container', (t) => {
    const map = createMap();
    new Marker()
        .setLngLat([-77.01866, 38.888])
        .addTo(map);

    t.equal(map.getCanvasContainer().querySelectorAll('.mapboxgl-marker').length, 1);

    map.remove();
    t.end();
});

test('Marker provides LngLat accessors', (t) => {
    t.equal(new Marker().getLngLat(), undefined);

    t.ok(new Marker().setLngLat([1, 2]).getLngLat() instanceof LngLat);
    t.deepEqual(new Marker().setLngLat([1, 2]).getLngLat(), new LngLat(1, 2));

    t.ok(new Marker().setLngLat(new LngLat(1, 2)).getLngLat() instanceof LngLat);
    t.deepEqual(new Marker().setLngLat(new LngLat(1, 2)).getLngLat(), new LngLat(1, 2));

    t.end();
});

test('Marker provides offset accessors', (t) => {
    t.ok(new Marker().setOffset([1, 2]).getOffset() instanceof Point);
    t.deepEqual(new Marker().setOffset([1, 2]).getOffset(), new Point(1, 2));

    t.ok(new Marker().setOffset(new Point(1, 2)).getOffset() instanceof Point);
    t.deepEqual(new Marker().setOffset(new Point(1, 2)).getOffset(), new Point(1, 2));

    t.end();
});

test('Marker anchor defaults to center', (t) => {
    const map = createMap();
    const marker = new Marker()
        .setLngLat([0, 0])
        .addTo(map);

    t.ok(marker.getElement().classList.contains('mapboxgl-marker-anchor-center'));
    t.match(marker.getElement().style.transform, /translate\(-50%,-50%\)/);

    map.remove();
    t.end();
});

test('Marker anchors as specified by the anchor option', (t) => {
    const map = createMap();
    const marker = new Marker({anchor: 'top'})
        .setLngLat([0, 0])
        .addTo(map);

    t.ok(marker.getElement().classList.contains('mapboxgl-marker-anchor-top'));
    t.match(marker.getElement().style.transform, /translate\(-50%,0\)/);

    map.remove();
    t.end();
});

test('Marker accepts backward-compatible constructor parameters', (t) => {
    const element = window.document.createElement('div');

    const m1 = new Marker(element);
    t.equal(m1.getElement(), element);

    const m2 = new Marker(element, { offset: [1, 2] });
    t.equal(m2.getElement(), element);
    t.ok(m2.getOffset().equals(new Point(1, 2)));
    t.end();
});

test('Marker drag functionality can be added with drag option', (t) => {
    const map = createMap();
    const marker = new Marker({draggable: true})
        .setLngLat([0, 0])
        .addTo(map);

    t.equal(marker.isDraggable(), true);

    map.remove();
    t.end();
});

test('Marker#setDraggable adds drag functionality', (t) => {
    const map = createMap();
    const marker = new Marker()
        .setLngLat([0, 0])
        .setDraggable(true)
        .addTo(map);

    t.equal(marker.isDraggable(), true);

    map.remove();
    t.end();
});

test('Marker#setDraggable turns off drag functionality', (t) => {
    const map = createMap();
    const marker = new Marker({draggable: true})
        .setLngLat([0, 0])
        .addTo(map);

    t.equal(marker.isDraggable(), true);

    marker.setDraggable(false);

    t.equal(marker.isDraggable(), false);

    map.remove();
    t.end();
});

test('Marker with draggable:true fires dragstart, drag, and dragend events at appropriate times in response to a mouse-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({draggable: true})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();

    const dragstart = t.spy();
    const drag      = t.spy();
    const dragend   = t.spy();

    marker.on('dragstart', dragstart);
    marker.on('drag',      drag);
    marker.on('dragend',   dragend);

    simulate.mousedown(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.mousemove(el);
    t.equal(dragstart.callCount, 1);
    t.equal(drag.callCount, 1);
    t.equal(dragend.callCount, 0);

    simulate.mouseup(el);
    t.equal(dragstart.callCount, 1);
    t.equal(drag.callCount, 1);
    t.equal(dragend.callCount, 1);

    map.remove();
    t.end();
});

test('Marker with draggable:false does not fire dragstart, drag, and dragend events in response to a mouse-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();

    const dragstart = t.spy();
    const drag      = t.spy();
    const dragend   = t.spy();

    marker.on('dragstart', dragstart);
    marker.on('drag',      drag);
    marker.on('dragend',   dragend);

    simulate.mousedown(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.mousemove(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.mouseup(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    map.remove();
    t.end();
});

test('Marker with draggable:true fires dragstart, drag, and dragend events at appropriate times in response to a touch-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({draggable: true})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();

    const dragstart = t.spy();
    const drag      = t.spy();
    const dragend   = t.spy();

    marker.on('dragstart', dragstart);
    marker.on('drag',      drag);
    marker.on('dragend',   dragend);

    simulate.touchstart(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.touchmove(el);
    t.equal(dragstart.callCount, 1);
    t.equal(drag.callCount, 1);
    t.equal(dragend.callCount, 0);

    simulate.touchend(el);
    t.equal(dragstart.callCount, 1);
    t.equal(drag.callCount, 1);
    t.equal(dragend.callCount, 1);

    map.remove();
    t.end();
});

test('Marker with draggable:false does not fire dragstart, drag, and dragend events in response to a touch-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();

    const dragstart = t.spy();
    const drag      = t.spy();
    const dragend   = t.spy();

    marker.on('dragstart', dragstart);
    marker.on('drag',      drag);
    marker.on('dragend',   dragend);

    simulate.touchstart(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.touchmove(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    simulate.touchend(el);
    t.equal(dragstart.callCount, 0);
    t.equal(drag.callCount, 0);
    t.equal(dragend.callCount, 0);

    map.remove();
    t.end();
});

test('Marker with draggable:true moves to new position in response to a mouse-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({draggable: true})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();
    const startPos = map.project(marker.getLngLat());
    simulate.mousedown(el);
    simulate.mousemove(el, {clientX: 10, clientY: 10});
    simulate.mouseup(el);

    const endPos = map.project(marker.getLngLat());
    t.equal(Math.floor(endPos.x), startPos.x + 10);
    t.equal(Math.floor(endPos.y), startPos.y + 10);

    map.remove();
    t.end();
});

test('Marker with draggable:false does not move to new position in response to a mouse-triggered drag', (t) => {
    const map = createMap();
    const marker = new Marker({})
        .setLngLat([0, 0])
        .addTo(map);
    const el = marker.getElement();
    const startPos = map.project(marker.getLngLat());

    simulate.mousedown(el);
    simulate.mousemove(el);
    simulate.mouseup(el);

    const endPos = map.project(marker.getLngLat());

    t.equal(startPos.x, endPos.x);
    t.equal(startPos.y, endPos.y);

    map.remove();
    t.end();
});
