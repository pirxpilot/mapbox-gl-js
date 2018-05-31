// 




import v8 from './reference/v8.json';
import latest from './reference/latest';
import format from './format';
import migrate from './migrate';
import composite from './composite';
import diff from './diff';
import ValidationError from './error/validation_error';
import ParsingError from './error/parsing_error';
import { StyleExpression, isExpression, createExpression, createPropertyExpression, normalizePropertyExpression, ZoomConstantExpression, ZoomDependentExpression, StylePropertyFunction } from './expression';
import featureFilter from './feature_filter';
import Color from './util/color';
import { createFunction, isFunction } from './function';
import convertFunction from './function/convert';

import validate from './validate_style';

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

export {
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
    styleFunction as function,
    validate
};

validate.parsed = validate;
validate.latest = validate;
