
module.exports = createFilter;

const types = ['Unknown', 'Point', 'LineString', 'Polygon'];

/**
 * Given a filter expressed as nested arrays, return a new function
 * that evaluates whether a given feature (with a .properties or .tags property)
 * passes its test.
 *
 * @private
 * @param {Array} filter mapbox gl filter
 * @returns {Function} filter-evaluating function
 */
function createFilter(filter) {
    return new Function('f', `var p = (f && f.properties || {}); return ${compile(filter)}`);
}

function compile(filter) {
    if (!filter) return 'true';
    const op = filter[0];
    if (filter.length <= 1) return op === 'any' ? 'false' : 'true';
    let str = 'true';
    let negation = false;
    switch (op) {
    case '==':
        str = compileComparisonOp(filter[1], filter[2], '===', false);
        break;
    case '!=':
        str = compileComparisonOp(filter[1], filter[2], '!==', false);
        break;
    case '<':
    case '>':
    case '<=':
    case '>=':
        str = compileComparisonOp(filter[1], filter[2], op, true);
        break;
    case 'all':
        str = compileLogicalOp(filter.slice(1), '&&');
        break;
    case 'none':
        negation = true;
        // eslint-disable-next-line no-fallthrough
    case 'any':
        str = compileLogicalOp(filter.slice(1), '||');
        break;
    case '!in':
        negation = true;
        // eslint-disable-next-line no-fallthrough
    case 'in':
        str = compileInOp(filter[1], filter.slice(2));
        break;
    case '!has':
        negation = true;
        // eslint-disable-next-line no-fallthrough
    case 'has':
        str = compileHasOp(filter[1]);
        break;
    }
    return negation ? `(!(${str}))` : `(${str})`;
}

function compilePropertyReference(property) {
    const ref =
        property === '$type' ? 'f.type' :
        property === '$id' ? 'f.id' : `p[${JSON.stringify(property)}]`;
    return ref;
}

function compileComparisonOp(property, value, op, checkType) {
    const left = compilePropertyReference(property);
    const right = property === '$type' ? types.indexOf(value) : JSON.stringify(value);
    return (checkType ? `typeof ${left}=== typeof ${right}&&` : '') + left + op + right;
}

function compileLogicalOp(expressions, op) {
    return expressions.map(compile).join(op);
}

function compileInOp(property, values) {
    if (property === '$type') values = values.map((value) => {
        return types.indexOf(value);
    });
    const left = JSON.stringify(values.sort(compare));
    const right = compilePropertyReference(property);

    if (values.length <= 200) return `${left}.indexOf(${right}) !== -1`;

    return `${'function(v, a, i, j) {' +
        'while (i <= j) { var m = (i + j) >> 1;' +
        '    if (a[m] === v) return true; if (a[m] > v) j = m - 1; else i = m + 1;' +
        '}' +
    'return false; }('}${right}, ${left},0,${values.length - 1})`;
}

function compileHasOp(property) {
    return property === '$id' ? '"id" in f' : `${JSON.stringify(property)} in p`;
}

// Comparison function to sort numbers and strings
function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
