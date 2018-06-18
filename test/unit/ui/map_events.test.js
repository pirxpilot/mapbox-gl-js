const { test } = require('mapbox-gl-js-test');
const Map = require('../../../src/ui/map');
const window = require('../../../src/util/window');
const simulate = require('mapbox-gl-js-test/simulate_interaction');

function createMap() {
    return new Map({
        container: window.document.createElement('div')
    });
}

test('Map#on adds a non-delegated event listener', (t) => {
    const map = createMap();
    const spy = t.spy(function (e) {
        t.equal(this, map);
        t.equal(e.type, 'click');
    });

    map.on('click', spy);
    simulate.click(map.getCanvas());

    t.ok(spy.calledOnce);
    t.end();
});

test('Map#off removes a non-delegated event listener', (t) => {
    const map = createMap();
    const spy = t.spy();

    map.on('click', spy);
    map.off('click', spy);
    simulate.click(map.getCanvas());

    t.ok(spy.notCalled);
    t.end();
});

test(`Map#on mousedown can have default behavior prevented and still fire subsequent click event`, (t) => {
    const map = createMap();

    map.on('mousedown', e => e.preventDefault());

    const click = t.spy();
    map.on('click', click);

    simulate.click(map.getCanvas());
    t.ok(click.callCount, 1);

    map.remove();
    t.end();
});

test(`Map#on mousedown doesn't fire subsequent click event if mousepos changes`, (t) => {
    const map = createMap();

    map.on('mousedown', e => e.preventDefault());

    const click = t.spy();
    map.on('click', click);
    const canvas = map.getCanvas();

    simulate.drag(canvas, {}, {clientX: 100, clientY: 100});
    t.ok(click.notCalled);

    map.remove();
    t.end();
});

test(`Map#on mousedown fires subsequent click event if mouse position changes less than click tolerance`, (t) => {
    const map = createMap(t, { clickTolerance: 4 });

    map.on('mousedown', e => e.preventDefault());

    const click = t.spy();
    map.on('click', click);
    const canvas = map.getCanvas();

    simulate.drag(canvas, {clientX: 100, clientY: 100}, {clientX: 100, clientY: 103});
    t.ok(click.called);

    map.remove();
    t.end();
});

test(`Map#on mousedown does not fire subsequent click event if mouse position changes more than click tolerance`, (t) => {
    const map = createMap(t, { clickTolerance: 4 });

    map.on('mousedown', e => e.preventDefault());

    const click = t.spy();
    map.on('click', click);
    const canvas = map.getCanvas();

    simulate.drag(canvas, {clientX: 100, clientY: 100}, {clientX: 100, clientY: 104});
    t.ok(click.notCalled);

    map.remove();
    t.end();
});
