'use strict';
const validateStyleMin = require('../style-spec/validate_style.min');
const { ErrorEvent } = require('../util/evented');

function emitValidationErrors(emitter, errors) {
    let hasErrors = false;
    if (errors && errors.length) {
        for (const error of errors) {
            emitter.fire(new ErrorEvent(new Error(error.message)));
            hasErrors = true;
        }
    }
    return hasErrors;
}

module.exports = {
    validateStyle: validateStyleMin,
    validateSource: validateStyleMin.source,
    validateLight: validateStyleMin.light,
    validateFilter: validateStyleMin.filter,
    validatePaintProperty: validateStyleMin.paintProperty,
    validateLayoutProperty: validateStyleMin.layoutProperty,
    emitValidationErrors
};
