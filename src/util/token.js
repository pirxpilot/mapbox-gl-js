'use strict';

module.exports = resolveTokens;

function getValue(properties, key, lang) {
    let v;
    if (lang && key === 'name') {
        v = properties[`name_${lang}`] ||
            properties[`name:${lang}`] ||
            properties.name ||
            properties['name:latin'] ||
            properties.name_int;
    } else {
        v = properties[key];
    }
    return v == null ? '' : String(v);
}

/**
 * Replace tokens in a string template with values in an object
 *
 * @param properties a key/value relationship between tokens and replacements
 * @param text the template string
 * @returns the template with tokens replaced
 * @private
 */
function resolveTokens(properties, text, lang) {
    return text.replace(/{([^{}]+)}/g, (match, key) => getValue(properties, key, lang));
}
