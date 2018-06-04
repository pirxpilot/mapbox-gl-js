'use strict';

const assert = require('assert');

const { BooleanType } = require('../types');


class Case {

    constructor(type, branches, otherwise) {
        this.type = type;
        this.branches = branches;
        this.otherwise = otherwise;
    }

    static parse(args, context) {
        if (args.length < 4)
            return context.error(`Expected at least 3 arguments, but found only ${args.length - 1}.`);
        if (args.length % 2 !== 0)
            return context.error(`Expected an odd number of arguments.`);

        let outputType;
        if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }

        const branches = [];
        for (let i = 1; i < args.length - 1; i += 2) {
            const test = context.parse(args[i], i, BooleanType);
            if (!test) return null;

            const result = context.parse(args[i + 1], i + 1, outputType);
            if (!result) return null;

            branches.push([test, result]);

            outputType = outputType || result.type;
        }

        const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
        if (!otherwise) return null;

        assert(outputType);
        return new Case((outputType), branches, otherwise);
    }

    evaluate(ctx) {
        for (const [test, expression] of this.branches) {
            if (test.evaluate(ctx)) {
                return expression.evaluate(ctx);
            }
        }
        return this.otherwise.evaluate(ctx);
    }

    eachChild(fn) {
        for (const [test, expression] of this.branches) {
            fn(test);
            fn(expression);
        }
        fn(this.otherwise);
    }

    possibleOutputs() {
        return []
            .concat(...this.branches.map(branch => branch[1].possibleOutputs()))
            .concat(this.otherwise.possibleOutputs());
    }

    serialize() {
        const serialized = ["case"];
        this.eachChild(child => { serialized.push(child.serialize()); });
        return serialized;
    }
}

module.exports = Case;
