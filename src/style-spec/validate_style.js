const validateStyleMin = require('./validate_style.min');
const ParsingError = require('./error/parsing_error');
const jsonlint = require('@mapbox/jsonlint-lines-primitives');
const { v8 } = require('./style-spec');

/**
 * Validate a Mapbox GL style against the style specification.
 *
 * @private
 * @alias validate
 * @param {Object|String|Buffer} style The style to be validated. If a `String`
 *     or `Buffer` is provided, the returned errors will contain line numbers.
 * @param {Object} [styleSpec] The style specification to validate against.
 *     If omitted, the spec version is inferred from the stylesheet.
 * @returns {Array<ValidationError|ParsingError>}
 * @example
 *   var validate = require('mapbox-gl-style-spec').validate;
 *   var style = fs.readFileSync('./style.json', 'utf8');
 *   var errors = validate(style);
 */

function validateStyle(style, styleSpec) {
  if (style instanceof String || typeof style === 'string' || style instanceof Buffer) {
    try {
      style = jsonlint.parse(style.toString());
    } catch (e) {
      return [new ParsingError(e)];
    }
  }

  styleSpec = styleSpec || v8;

  return validateStyleMin(style, styleSpec);
}

validateStyle.source = validateStyleMin.source;
validateStyle.light = validateStyleMin.light;
validateStyle.layer = validateStyleMin.layer;
validateStyle.filter = validateStyleMin.filter;
validateStyle.paintProperty = validateStyleMin.paintProperty;
validateStyle.layoutProperty = validateStyleMin.layoutProperty;

module.exports = validateStyle;
