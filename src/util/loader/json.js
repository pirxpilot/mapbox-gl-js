'use strict';

const config = require('../config');
const loader = require('./index');

module.exports = json;

function json(url, fn) {
    const load = loader(config.LOADER_STRATEGY);

    load({ url, _ilk: 'json' }, done);

    function done(err, data) {
        if (err) { return fn(err); }
        fn(null, data && data.data);
    }
}
