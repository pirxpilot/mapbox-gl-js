'use strict';

const NullType = { kind: 'null' };
const NumberType = { kind: 'number' };
const StringType = { kind: 'string' };
const BooleanType = { kind: 'boolean' };
const ColorType = { kind: 'color' };
const ObjectType = { kind: 'object' };
const ValueType = { kind: 'value' };
const ErrorType = { kind: 'error' };
const CollatorType = { kind: 'collator' };

function array(itemType, N) {
    return {
        kind: 'array',
        itemType,
        N
    };
}

function toString(type) {
    if (type.kind === 'array') {
        const itemType = toString(type.itemType);
        return typeof type.N === 'number' ?
            `array<${itemType}, ${type.N}>` :
            type.itemType.kind === 'value' ? 'array' : `array<${itemType}>`;
    } else {
        return type.kind;
    }
}

const valueMemberTypes = [
    NullType,
    NumberType,
    StringType,
    BooleanType,
    ColorType,
    ObjectType,
    array(ValueType)
];

/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message.
 * @private
 */
function checkSubtype(expected, t) {
    if (t.kind === 'error') {
        // Error is a subtype of every type
        return null;
    } else if (expected.kind === 'array') {
        if (t.kind === 'array' &&
            !checkSubtype(expected.itemType, t.itemType) &&
            (typeof expected.N !== 'number' || expected.N === t.N)) {
            return null;
        }
    } else if (expected.kind === t.kind) {
        return null;
    } else if (expected.kind === 'value') {
        for (const memberType of valueMemberTypes) {
            if (!checkSubtype(memberType, t)) {
                return null;
            }
        }
    }

    return `Expected ${toString(expected)} but found ${toString(t)} instead.`;
}

module.exports = {
    NullType,
    NumberType,
    StringType,
    BooleanType,
    ColorType,
    ObjectType,
    ValueType,
    ErrorType,
    CollatorType,
    array,
    toString,
    checkSubtype
};
