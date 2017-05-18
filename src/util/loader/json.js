'use strict';

const loader = require('./index');

const load = loader();

module.exports = json;

function json(url, fn) {
    load({ url, _ilk: 'json' }, done);

    function done(err, data) {
        if (err) { return fn(err); }
        fn(null, data && data.data);
    }
}
