const { test } = require('../../util/mapbox-gl-js-test');
const convertFunction = require('../../../src/style-spec/function/convert');

test('convertFunction', async t => {
  await t.test('boolean categorical', t => {
    const fn = {
      type: 'categorical',
      property: 'p',
      stops: [
        [true, 'true'],
        [false, 'false']
      ],
      default: 'default'
    };

    t.assert.deepEqual(convertFunction(fn, {}), [
      'case',
      ['==', ['get', 'p'], true],
      'true',
      ['==', ['get', 'p'], false],
      'false',
      'default'
    ]);
  });

  await t.test('numeric categorical', t => {
    const fn = {
      type: 'categorical',
      property: 'p',
      stops: [
        [0, '0'],
        [1, '1']
      ],
      default: 'default'
    };

    t.assert.deepEqual(convertFunction(fn, {}), ['match', ['get', 'p'], 0, '0', 1, '1', 'default']);
  });

  await t.test('feature-constant text-field with token replacement', t => {
    const functionValue = {
      stops: [
        [0, 'my name is {name}.'],
        [1, '{a} {b} {c}'],
        [2, 'no tokens'],
        [3, '{one_token}'],
        [4, '{leading} token'],
        [5, 'trailing {token}']
      ]
    };

    const expression = convertFunction(functionValue, {
      type: 'string',
      'property-type': 'data-constant',
      expression: {
        interpolated: false,
        parameters: ['zoom']
      },
      tokens: true
    });
    t.assert.deepEqual(expression, [
      'step',
      ['zoom'],
      ['concat', 'my name is ', ['to-string', ['get', 'name']], '.'],
      1,
      ['concat', ['to-string', ['get', 'a']], ' ', ['to-string', ['get', 'b']], ' ', ['to-string', ['get', 'c']]],
      2,
      'no tokens',
      3,
      ['to-string', ['get', 'one_token']],
      4,
      ['concat', ['to-string', ['get', 'leading']], ' token'],
      5,
      ['concat', 'trailing ', ['to-string', ['get', 'token']]]
    ]);
  });

  await t.test('duplicate step function stops', t => {
    const functionValue = {
      stops: [
        [0, 'a'],
        [1, 'b'],
        [1, 'c'],
        [2, 'd']
      ]
    };

    const expression = convertFunction(functionValue, {
      type: 'string',
      'property-type': 'data-constant',
      expression: {
        interpolated: false,
        parameters: ['zoom']
      }
    });
    t.assert.deepEqual(expression, ['step', ['zoom'], 'a', 1, 'b', 2, 'd']);
  });

  await t.test('duplicate interpolate function stops', t => {
    const functionValue = {
      stops: [
        [0, 'a'],
        [1, 'b'],
        [1, 'c'],
        [2, 'd']
      ]
    };

    const expression = convertFunction(functionValue, {
      type: 'number',
      'property-type': 'data-constant',
      expression: {
        interpolated: true,
        parameters: ['zoom']
      }
    });
    t.assert.deepEqual(expression, ['interpolate', ['exponential', 1], ['zoom'], 0, 'a', 1, 'b', 2, 'd']);
  });
});
