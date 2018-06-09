'use strict';
const { createLayout } = require('../../util/struct_array');

const layout = createLayout([
    {name: 'a_pos', components: 2, type: 'Int16'}
], 4);

module.exports = layout;
