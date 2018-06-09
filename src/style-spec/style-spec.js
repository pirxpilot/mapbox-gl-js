'use strict';

const v8 = require('./reference/v8.json');
const latest = require('./reference/latest');
const format = require('./format');
const migrate = require('./migrate');
const composite = require('./composite');
const diff = require('./diff');
const ValidationError = require('./error/validation_error');
const ParsingError = require('./error/parsing_error');
const { StyleExpression, isExpression, createExpression, createPropertyExpression, normalizePropertyExpression, ZoomConstantExpression, ZoomDependentExpression, StylePropertyFunction } = require('./expression');
const featureFilter = require('./feature_filter');
const Color = require('./util/color');
const { createFunction, isFunction } = require('./function');
const convertFunction = require('./function/convert');

const validate = require('./validate_style');

const expression = {
    StyleExpression,
    isExpression,
    createExpression,
    createPropertyExpression,
    normalizePropertyExpression,
    ZoomConstantExpression,
    ZoomDependentExpression,
    StylePropertyFunction
};

const styleFunction = {
    convertFunction,
    createFunction,
    isFunction
};

module.exports = {
    v8,
    latest,
    format,
    migrate,
    composite,
    diff,
    ValidationError,
    ParsingError,
    expression,
    featureFilter,
    Color,
    function: styleFunction,
    validate
};

validate.parsed = validate;
validate.latest = validate;
