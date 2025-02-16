const assert = require('assert');

const Grid = require('grid-index');
const Color = require('../style-spec/util/color');
const {
  StylePropertyFunction,
  StyleExpression,
  ZoomDependentExpression,
  ZoomConstantExpression
} = require('../style-spec/expression');
const CompoundExpression = require('../style-spec/expression/compound_expression');
const expressions = require('../style-spec/expression/definitions');

const registry = {};

/**
 * Register the given class as serializable.
 *
 * @param options
 * @param options.omit List of properties to omit from serialization (e.g., cached/computed properties)
 * @param options.shallow List of properties that should be serialized by a simple shallow copy, rather than by a recursive call to serialize().
 *
 * @private
 */
function register(name, klass, options = {}) {
  assert(!registry[name], `${name} is already registered.`);
  Object.defineProperty(klass, '_classRegistryKey', {
    value: name,
    writeable: false
  });
  registry[name] = {
    klass,
    omit: options.omit || [],
    shallow: options.shallow || []
  };
}

register('Object', Object);

Grid.serialize = function serializeGrid(grid, transferables) {
  const buffer = grid.toArrayBuffer();
  if (transferables) {
    transferables.push(buffer);
  }
  return { buffer };
};

Grid.deserialize = function deserializeGrid(serialized) {
  return new Grid(serialized.buffer);
};
register('Grid', Grid);

register('Color', Color);
register('Error', Error);

register('StylePropertyFunction', StylePropertyFunction);
register('StyleExpression', StyleExpression, { omit: ['_evaluator'] });

register('ZoomDependentExpression', ZoomDependentExpression);
register('ZoomConstantExpression', ZoomConstantExpression);
register('CompoundExpression', CompoundExpression, { omit: ['_evaluate'] });
for (const name in expressions) {
  if (expressions[name]._classRegistryKey) continue;
  register(`Expression_${name}`, expressions[name]);
}

/**
 * Serialize the given object for transfer to or from a web worker.
 *
 * For non-builtin types, recursively serialize each property (possibly
 * omitting certain properties - see register()), and package the result along
 * with the constructor's `name` so that the appropriate constructor can be
 * looked up in `deserialize()`.
 *
 * If a `transferables` array is provided, add any transferable objects (i.e.,
 * any ArrayBuffers or ArrayBuffer views) to the list. (If a copy is needed,
 * this should happen in the client code, before using serialize().)
 *
 * @private
 */
function serialize(input, transferables) {
  if (
    input === null ||
    input === undefined ||
    typeof input === 'boolean' ||
    typeof input === 'number' ||
    typeof input === 'string' ||
    input instanceof Boolean ||
    input instanceof Number ||
    input instanceof String ||
    input instanceof Date ||
    input instanceof RegExp
  ) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    if (transferables) {
      transferables.push(input);
    }
    return input;
  }

  if (ArrayBuffer.isView(input)) {
    const view = input;
    if (transferables) {
      transferables.push(view.buffer);
    }
    return view;
  }

  if (input instanceof window.ImageData) {
    if (transferables) {
      transferables.push(input.data.buffer);
    }
    return input;
  }

  if (Array.isArray(input)) {
    const serialized = [];
    for (const item of input) {
      serialized.push(serialize(item, transferables));
    }
    return serialized;
  }

  if (typeof input === 'object') {
    const klass = input.constructor;
    const name = klass._classRegistryKey;
    if (!name) {
      throw new Error(`can't serialize object of unregistered class`);
    }
    assert(registry[name]);

    const properties = klass.serialize
      ? // (Temporary workaround) allow a class to provide static
        // `serialize()` and `deserialize()` methods to bypass the generic
        // approach.
        // This temporary workaround lets us use the generic serialization
        // approach for objects whose members include instances of dynamic
        // StructArray types. Once we refactor StructArray to be static,
        // we can remove this complexity.
        klass.serialize(input, transferables)
      : {};

    if (!klass.serialize) {
      for (const key in input) {
        // any cast due to https://github.com/facebook/flow/issues/5393
        if (!input.hasOwnProperty(key)) continue;
        if (registry[name].omit.indexOf(key) >= 0) continue;
        const property = input[key];
        properties[key] = registry[name].shallow.indexOf(key) >= 0 ? property : serialize(property, transferables);
      }
      if (input instanceof Error) {
        properties.message = input.message;
      }
    } else {
      // make sure statically serialized object survives transfer of $name property
      assert(!transferables || properties !== transferables[transferables.length - 1]);
    }

    if (properties.$name) {
      throw new Error('$name property is reserved for worker serialization logic.');
    }
    if (name !== 'Object') {
      properties.$name = name;
    }

    return properties;
  }

  throw new Error(`can't serialize object of type ${typeof input}`);
}

function deserialize(input) {
  if (
    input === null ||
    input === undefined ||
    typeof input === 'boolean' ||
    typeof input === 'number' ||
    typeof input === 'string' ||
    input instanceof Boolean ||
    input instanceof Number ||
    input instanceof String ||
    input instanceof Date ||
    input instanceof RegExp ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input) ||
    input instanceof window.ImageData
  ) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(deserialize);
  }

  if (typeof input === 'object') {
    const name = input.$name || 'Object';

    const { klass } = registry[name];
    if (!klass) {
      throw new Error(`can't deserialize unregistered class ${name}`);
    }

    if (klass.deserialize) {
      return klass.deserialize(input);
    }

    const result = Object.create(klass.prototype);

    for (const key of Object.keys(input)) {
      if (key === '$name') continue;
      const value = input[key];
      result[key] = registry[name].shallow.indexOf(key) >= 0 ? value : deserialize(value);
    }

    return result;
  }

  throw new Error(`can't deserialize object of type ${typeof input}`);
}

module.exports = {
  register,
  serialize,
  deserialize
};
