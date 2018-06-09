'use strict';
const { createLayout } = require('../../util/struct_array');

const layout = createLayout([
    {name: 'a_pos_normal', components: 4, type: 'Int16'},
    {name: 'a_data', components: 4, type: 'Uint8'}
], 4);

module.exports = layout;
