const { test: t } = require('mapbox-gl-js-test');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const validate = require('../../../src/style-spec/validate_style');
const v8 = require('../../../src/style-spec/reference/v8');
const migrate = require('../../../src/style-spec/migrate');

/* eslint-disable import/namespace */
const spec = require('../../../src/style-spec/style-spec');

const UPDATE = !!process.env.UPDATE;

t('does not migrate from version 5', (t) => {
    t.throws(() => {
        migrate({version: 5, layers: []});
    }, new Error('cannot migrate from', 5));
    t.end();
});

t('does not migrate from version 6', (t) => {
    t.throws(() => {
        migrate({version: 6, layers: []});
    }, new Error('cannot migrate from', 6));
    t.end();
});

t('migrates to latest version from version 7', (t) => {
    t.deepEqual(migrate({version: 7, layers: []}).version, spec.latest.$version);
    t.end();
});

glob.sync(`${__dirname}/fixture/v7-migrate/*.input.json`).forEach((file) => {
    t(path.basename(file), (t) => {
        const outputfile = file.replace('.input', '.output');
        const style = JSON.parse(fs.readFileSync(file));
        const result = migrate(style);
        t.deepEqual(validate.parsed(result, v8), []);
        if (UPDATE) fs.writeFileSync(outputfile, JSON.stringify(result, null, 2));
        const expect = JSON.parse(fs.readFileSync(outputfile));
        t.deepEqual(result, expect);
        t.end();
    });
});
