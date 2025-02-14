'use strict';

const ValidationError = require('../error/validation_error');

const { createExpression, createPropertyExpression } = require('../expression');
const { deepUnbundle } = require('../util/unbundle_jsonlint');
const { isStateConstant } = require('../expression/is_constant');

module.exports = function validateExpression(options) {
  const expression = (options.expressionContext === 'property' ? createPropertyExpression : createExpression)(
    deepUnbundle(options.value),
    options.valueSpec
  );
  if (expression.result === 'error') {
    return expression.value.map(error => {
      return new ValidationError(`${options.key}${error.key}`, options.value, error.message);
    });
  }

  if (
    options.expressionContext === 'property' &&
    options.propertyKey === 'text-font' &&
    expression.value._styleExpression.expression.possibleOutputs().indexOf(undefined) !== -1
  ) {
    return [
      new ValidationError(
        options.key,
        options.value,
        'Invalid data expression for "text-font". Output values must be contained as literals within the expression.'
      )
    ];
  }

  if (
    options.expressionContext === 'property' &&
    options.propertyType === 'layout' &&
    !isStateConstant(expression.value._styleExpression.expression)
  ) {
    return [
      new ValidationError(
        options.key,
        options.value,
        '"feature-state" data expressions are not supported with layout properties.'
      )
    ];
  }
  return [];
};
