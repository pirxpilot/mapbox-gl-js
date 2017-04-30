
// not as nice as 'util/format' but much cheaper
function format(str, ...params) {
    let i = 0;
    return str.replace(/%[sd]/ig, () => params[i++]);
}

function ValidationError(key, value, ...message) {
    this.message = key ? `${key}: ` : '';
    this.message += format(...message);

    if (value !== null && value !== undefined && value.__line__) {
        this.line = value.__line__;
    }
}

module.exports = ValidationError;
