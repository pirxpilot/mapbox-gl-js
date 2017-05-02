'use strict';

const test = require('mapbox-gl-js-test').test;
const {
    arraysIntersect,
    bindAll,
    clone,
    deepEqual,
    filterObject,
    keysDifference,
    mapObject,
    pick
} = require('../../../src/util/object');

test('object', (t) => {
    t.deepEqual(keysDifference({a:1}, {}), ['a'], 'keysDifference');
    t.deepEqual(keysDifference({a:1}, {a:1}), [], 'keysDifference');
    t.deepEqual(pick({a:1, b:2, c:3}, ['a', 'c']), {a:1, c:3}, 'pick');
    t.deepEqual(pick({a:1, b:2, c:3}, ['a', 'c', 'd']), {a:1, c:3}, 'pick');

    t.test('bindAll', (t) => {
        function MyClass() {
            bindAll(['ontimer'], this);
            this.name = 'Tom';
        }
        MyClass.prototype.ontimer = function() {
            t.equal(this.name, 'Tom');
            t.end();
        };
        const my = new MyClass();
        setTimeout(my.ontimer, 0);
    });

    t.test('map', (t) => {
        t.plan(6);
        t.deepEqual(mapObject({}, () => { t.ok(false); }), {});
        const that = {};
        t.deepEqual(mapObject({map: 'box'}, function(value, key, object) {
            t.equal(value, 'box');
            t.equal(key, 'map');
            t.deepEqual(object, {map: 'box'});
            t.equal(this, that);
            return 'BOX';
        }, that), {map: 'BOX'});
    });

    t.test('filter', (t) => {
        t.plan(6);
        t.deepEqual(filterObject({}, () => { t.ok(false); }), {});
        const that = {};
        filterObject({map: 'box'}, function(value, key, object) {
            t.equal(value, 'box');
            t.equal(key, 'map');
            t.deepEqual(object, {map: 'box'});
            t.equal(this, that);
            return true;
        }, that);
        t.deepEqual(filterObject({map: 'box', box: 'map'}, (value) => {
            return value === 'box';
        }), {map: 'box'});
        t.end();
    });

    t.test('deepEqual', (t) => {
        const a = {
            foo: 'bar',
            bar: {
                baz: 5,
                lol: ["cat", 2]
            }
        };
        const b = JSON.parse(JSON.stringify(a));
        const c = JSON.parse(JSON.stringify(a));
        c.bar.lol[0] = "z";

        t.ok(deepEqual(a, b));
        t.notOk(deepEqual(a, c));
        t.notOk(deepEqual(a, null));
        t.notOk(deepEqual(null, c));
        t.ok(deepEqual(null, null));

        t.end();
    });

    t.test('clone', (t) => {
        t.test('array', (t) => {
            const input = [false, 1, 'two'];
            const output = clone(input);
            t.notEqual(input, output);
            t.deepEqual(input, output);
            t.end();
        });

        t.test('object', (t) => {
            const input = {a: false, b: 1, c: 'two'};
            const output = clone(input);
            t.notEqual(input, output);
            t.deepEqual(input, output);
            t.end();
        });

        t.test('deep object', (t) => {
            const input = {object: {a: false, b: 1, c: 'two'}};
            const output = clone(input);
            t.notEqual(input.object, output.object);
            t.deepEqual(input.object, output.object);
            t.end();
        });

        t.test('deep array', (t) => {
            const input = {array: [false, 1, 'two']};
            const output = clone(input);
            t.notEqual(input.array, output.array);
            t.deepEqual(input.array, output.array);
            t.end();
        });

        t.end();
    });

    t.test('arraysIntersect', (t) => {
        t.test('intersection', (t) => {
            const a = ["1", "2", "3"];
            const b = ["5", "4", "3"];

            t.equal(arraysIntersect(a, b), true);
            t.end();
        });

        t.test('no intersection', (t) => {
            const a = ["1", "2", "3"];
            const b = ["4", "5", "6"];

            t.equal(arraysIntersect(a, b), false);
            t.end();
        });

        t.end();
    });

    t.end();
});
