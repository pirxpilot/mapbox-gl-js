'use strict';

const assert = require('assert');

const {
    ObjectType,
    ValueType,
    StringType,
    NumberType,
    BooleanType,
    checkSubtype,
    toString
} = require('../types');
const RuntimeError = require('../runtime_error');
const { typeOf } = require('../values');


const types = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType,
    object: ObjectType
};

class Assertion {

    constructor(type, args) {
        this.type = type;
        this.args = args;
    }

    static parse(args, context) {
        if (args.length < 2)
            return context.error(`Expected at least one argument.`);

        const name = (args[0]);
        assert(types[name], name);

        const type = types[name];

        const parsed = [];
        for (let i = 1; i < args.length; i++) {
            const input = context.parse(args[i], i, ValueType);
            if (!input) return null;
            parsed.push(input);
        }

        return new Assertion(type, parsed);
    }

    evaluate(ctx) {
        for (let i = 0; i < this.args.length; i++) {
            const value = this.args[i].evaluate(ctx);
            const error = checkSubtype(this.type, typeOf(value));
            if (!error) {
                return value;
            } else if (i === this.args.length - 1) {
                throw new RuntimeError(`Expected value to be of type ${toString(this.type)}, but found ${toString(typeOf(value))} instead.`);
            }
        }

        assert(false);
        return null;
    }

    eachChild(fn) {
        this.args.forEach(fn);
    }

    possibleOutputs() {
        return [].concat(...this.args.map((arg) => arg.possibleOutputs()));
    }

    serialize() {
        return [this.type.kind].concat(this.args.map(arg => arg.serialize()));
    }
}

module.exports = Assertion;
