const ValidationError = require('../error/validation_error');
const getType = require('../util/get_type');
const { parseCSSColor } = require('csscolorparser');

module.exports = function validateColor(options) {
  const key = options.key;
  const value = options.value;
  const type = getType(value);

  if (type !== 'string') {
    return [new ValidationError(key, value, `color expected, ${type} found`)];
  }

  if (parseCSSColor(value) === null) {
    return [new ValidationError(key, value, `color expected, "${value}" found`)];
  }

  return [];
};
