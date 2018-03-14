const { createLayout } = require('../../util/struct_array');

const layout = createLayout([
  // [tl.x, tl.y, br.x, br.y]
  { name: 'a_pattern_from', components: 4, type: 'Uint16' },
  { name: 'a_pattern_to', components: 4, type: 'Uint16' }
]);

module.exports = layout;
