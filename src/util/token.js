module.exports = resolveTokens;

/**
 * Replace tokens in a string template with values in an object
 *
 * @param properties a key/value relationship between tokens and replacements
 * @param text the template string
 * @returns the template with tokens replaced
 * @private
 */
function resolveTokens(properties, text) {
  return text.replace(/{([^{}]+)}/g, (match, key) => String(properties[key] ?? ''));
}
