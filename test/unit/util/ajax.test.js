const { test } = require('mapbox-gl-js-test');
const {
    getArrayBuffer,
    getJSON
} = require('../../../src/util/ajax');
const window = require('../../../src/util/window');

test('ajax', { skip: true }, async (t) => {
    t.beforeEach(() => {
        window.useFakeXMLHttpRequest();
    });

    t.afterEach(() => {
        window.restore();
    });

    await t.test('getArrayBuffer, no content error', (t, done) => {
        window.server.respondWith(request => {
            request.respond(200, { 'Content-Type': 'image/png' }, '');
        });
        getArrayBuffer({ url: '' }, (error) => {
            t.pass('called getArrayBuffer');
            t.ok(error, 'should error when the status is 200 without content.');
            done();
        });
        window.server.respond();
    });

    await t.test('getArrayBuffer, 404', (t, done) => {
        window.server.respondWith(request => {
            request.respond(404);
        });
        getArrayBuffer({ url: '' }, (error) => {
            t.equal(error.status, 404);
            done();
        });
        window.server.respond();
    });

    await t.test('getJSON', (t, done) => {
        window.server.respondWith(request => {
            request.respond(200, { 'Content-Type': 'application/json' }, '{"foo": "bar"}');
        });
        getJSON({ url: '' }, (error, body) => {
            t.ifError(error);
            t.deepEqual(body, { data: { foo: 'bar' } });
            done();
        });
        window.server.respond();
    });

    await t.test('getJSON, invalid syntax', (t, done) => {
        window.server.respondWith(request => {
            request.respond(200, { 'Content-Type': 'application/json' }, 'how do i even');
        });
        getJSON({ url: '' }, (error) => {
            t.ok(error);
            done();
        });
        window.server.respond();
    });

    await t.test('getJSON, 404', (t, done) => {
        window.server.respondWith(request => {
            request.respond(404);
        });
        getJSON({ url: '' }, (error) => {
            t.equal(error.status, 404);
            done();
        });
        window.server.respond();
    });

    await t.test('getJSON, 401: non-Mapbox domain', (t, done) => {
        window.server.respondWith(request => {
            request.respond(401);
        });
        getJSON({ url: '' }, (error) => {
            t.equal(error.status, 401);
            t.equal(error.message, "Unauthorized");
            done();
        });
        window.server.respond();
    });

    await t.test('getJSON, 401: Mapbox domain', (t, done) => {
        window.server.respondWith(request => {
            request.respond(401);
        });
        getJSON({ url: 'api.mapbox.com' }, (error) => {
            t.equal(error.status, 401);
            t.equal(error.message, "Unauthorized: you may have provided an invalid Mapbox access token. See https://www.mapbox.com/api-documentation/#access-tokens");
            done();
        });
        window.server.respond();
    });
});
