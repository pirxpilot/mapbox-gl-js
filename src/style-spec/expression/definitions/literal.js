// 

import assert from 'assert';
import { isValue, typeOf, Color } from '../values';


class Literal {

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    static parse(args, context) {
        if (args.length !== 2)
            return context.error(`'literal' expression requires exactly one argument, but found ${args.length - 1} instead.`);

        if (!isValue(args[1]))
            return context.error(`invalid value`);

        const value = (args[1]);
        let type = typeOf(value);

        // special case: infer the item type if possible for zero-length arrays
        const expected = context.expectedType;
        if (
            type.kind === 'array' &&
            type.N === 0 &&
            expected &&
            expected.kind === 'array' &&
            (typeof expected.N !== 'number' || expected.N === 0)
        ) {
            type = expected;
        }

        return new Literal(type, value);
    }

    evaluate() {
        return this.value;
    }

    eachChild() {}

    possibleOutputs() {
        return [this.value];
    }

    serialize() {
        if (this.type.kind === 'array' || this.type.kind === 'object') {
            return ["literal", this.value];
        } else if (this.value instanceof Color) {
            // Constant-folding can generate Literal expressions that you
            // couldn't actually generate with a "literal" expression,
            // so we have to implement an equivalent serialization here
            return ["rgba"].concat(this.value.toArray());
        } else {
            assert(this.value === null ||
                typeof this.value === 'string' ||
                typeof this.value === 'number' ||
                typeof this.value === 'boolean');
            return (this.value);
        }
    }
}

export default Literal;
