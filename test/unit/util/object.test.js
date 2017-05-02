'use strict';
// @flow

const test = require('mapbox-gl-js-test').test;
const object = require('../../../src/util/object');

test('object', (t) => {
    t.deepEqual(object.keysDifference({a:1}, {}), ['a'], 'keysDifference');
    t.deepEqual(object.keysDifference({a:1}, {a:1}), [], 'keysDifference');
    t.deepEqual(object.pick({a:1, b:2, c:3}, ['a', 'c']), {a:1, c:3}, 'pick');
    t.deepEqual(object.pick({a:1, b:2, c:3}, ['a', 'c', 'd']), {a:1, c:3}, 'pick');

    t.test('bindAll', (t) => {
        function MyClass() {
            object.bindAll(['ontimer'], this);
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
        t.deepEqual(object.map({}, () => { t.ok(false); }), {});
        const that = {};
        t.deepEqual(object.map({map: 'box'}, function(value, key, object) {
            t.equal(value, 'box');
            t.equal(key, 'map');
            t.deepEqual(object, {map: 'box'});
            t.equal(this, that);
            return 'BOX';
        }, that), {map: 'BOX'});
    });

    t.test('filter', (t) => {
        t.plan(6);
        t.deepEqual(object.filter({}, () => { t.ok(false); }), {});
        const that = {};
        object.filter({map: 'box'}, function(value, key, object) {
            t.equal(value, 'box');
            t.equal(key, 'map');
            t.deepEqual(object, {map: 'box'});
            t.equal(this, that);
            return true;
        }, that);
        t.deepEqual(object.filter({map: 'box', box: 'map'}, (value) => {
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

        t.ok(object.deepEqual(a, b));
        t.notOk(object.deepEqual(a, c));
        t.notOk(object.deepEqual(a, null));
        t.notOk(object.deepEqual(null, c));
        t.ok(object.deepEqual(null, null));

        t.end();
    });

    t.test('clone', (t) => {
        t.test('array', (t) => {
            const input = [false, 1, 'two'];
            const output = object.clone(input);
            t.notEqual(input, output);
            t.deepEqual(input, output);
            t.end();
        });

        t.test('object', (t) => {
            const input = {a: false, b: 1, c: 'two'};
            const output = object.clone(input);
            t.notEqual(input, output);
            t.deepEqual(input, output);
            t.end();
        });

        t.test('deep object', (t) => {
            const input = {object: {a: false, b: 1, c: 'two'}};
            const output = object.clone(input);
            t.notEqual(input.object, output.object);
            t.deepEqual(input.object, output.object);
            t.end();
        });

        t.test('deep array', (t) => {
            const input = {array: [false, 1, 'two']};
            const output = object.clone(input);
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

            t.equal(object.arraysIntersect(a, b), true);
            t.end();
        });

        t.test('no intersection', (t) => {
            const a = ["1", "2", "3"];
            const b = ["4", "5", "6"];

            t.equal(object.arraysIntersect(a, b), false);
            t.end();
        });

        t.end();
    });

    t.end();
});
