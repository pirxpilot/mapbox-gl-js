function supportsPropertyExpression(spec) {
  return spec['property-type'] === 'data-driven' || spec['property-type'] === 'cross-faded-data-driven';
}

function supportsZoomExpression(spec) {
  return !!spec.expression && spec.expression.parameters.indexOf('zoom') > -1;
}

function supportsInterpolation(spec) {
  return !!spec.expression && spec.expression.interpolated;
}

module.exports = {
  supportsPropertyExpression,
  supportsZoomExpression,
  supportsInterpolation
};
