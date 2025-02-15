const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');

const spec = require('../../src/style-spec/reference/v8');

function typeToClass(property) {
  switch (property['property-type']) {
    case 'data-driven':
      return 'DataDrivenProperty';
    case 'cross-faded':
      return 'CrossFadedProperty';
    case 'color-ramp':
      return 'ColorRampProperty';
    case 'data-constant':
    case 'constant':
      return 'DataConstantProperty';
    default:
      throw new Error(`unknown property-type '${property['property-type']}' for ${property.name}`);
  }
}

function propertyValue(property, type) {
  const klass = typeToClass(property);
  return `new ${klass}(styleSpec['${type}_${property.layerType}']['${property.name}'])`;
}

const propertiesJs = ejs.compile(fs.readFileSync(resolve('../layout/layer_properties.js.ejs'), 'utf8'), {
  strict: true
});

const layers = Object.keys(spec.layer.type.values).map(type => {
  const layoutProperties = Object.keys(spec[`layout_${type}`]).reduce((memo, name) => {
    if (name !== 'visibility') {
      spec[`layout_${type}`][name].name = name;
      spec[`layout_${type}`][name].layerType = type;
      memo.push(spec[`layout_${type}`][name]);
    }
    return memo;
  }, []);

  const paintProperties = Object.keys(spec[`paint_${type}`]).reduce((memo, name) => {
    spec[`paint_${type}`][name].name = name;
    spec[`paint_${type}`][name].layerType = type;
    memo.push(spec[`paint_${type}`][name]);
    return memo;
  }, []);

  const klasses = new Set([...layoutProperties, ...paintProperties].map(typeToClass));

  return {
    type,
    layoutProperties,
    paintProperties,
    klasses: Array.from(klasses).sort(),
    propertyValue
  };
});

for (const layer of layers) {
  fs.writeFileSync(
    resolve(`../../src/style/style_layer/${layer.type.replace('-', '_')}_style_layer_properties.js`),
    propertiesJs(layer)
  );
}

function resolve(file) {
  return path.resolve(__dirname, file);
}
