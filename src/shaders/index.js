'use strict';

const shaders = {
    prelude: {
        fragmentSource: require('../../build/min/glsl/_prelude.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/_prelude.vertex.glsl.txt')
    },
    background: {
        fragmentSource: require('../../build/min/glsl/background.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/background.vertex.glsl.txt')
    },
    backgroundPattern: {
        fragmentSource: require('../../build/min/glsl/background_pattern.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/background_pattern.vertex.glsl.txt')
    },
    circle: {
        fragmentSource: require('../../build/min/glsl/circle.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/circle.vertex.glsl.txt')
    },
    clippingMask: {
        fragmentSource: require('../../build/min/glsl/clipping_mask.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/clipping_mask.vertex.glsl.txt')
    },
    heatmap: {
        fragmentSource: require('../../build/min/glsl/heatmap.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/heatmap.vertex.glsl.txt')
    },
    heatmapTexture: {
        fragmentSource: require('../../build/min/glsl/heatmap_texture.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/heatmap_texture.vertex.glsl.txt')
    },
    collisionBox: {
        fragmentSource: require('../../build/min/glsl/collision_box.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/collision_box.vertex.glsl.txt')
    },
    collisionCircle: {
        fragmentSource: require('../../build/min/glsl/collision_circle.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/collision_circle.vertex.glsl.txt')
    },
    debug: {
        fragmentSource: require('../../build/min/glsl/debug.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/debug.vertex.glsl.txt')
    },
    fill: {
        fragmentSource: require('../../build/min/glsl/fill.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill.vertex.glsl.txt')
    },
    fillOutline: {
        fragmentSource: require('../../build/min/glsl/fill_outline.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill_outline.vertex.glsl.txt')
    },
    fillOutlinePattern: {
        fragmentSource: require('../../build/min/glsl/fill_outline_pattern.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill_outline_pattern.vertex.glsl.txt')
    },
    fillPattern: {
        fragmentSource: require('../../build/min/glsl/fill_pattern.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill_pattern.vertex.glsl.txt')
    },
    fillExtrusion: {
        fragmentSource: require('../../build/min/glsl/fill_extrusion.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill_extrusion.vertex.glsl.txt')
    },
    fillExtrusionPattern: {
        fragmentSource: require('../../build/min/glsl/fill_extrusion_pattern.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/fill_extrusion_pattern.vertex.glsl.txt')
    },
    extrusionTexture: {
        fragmentSource: require('../../build/min/glsl/extrusion_texture.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/extrusion_texture.vertex.glsl.txt')
    },
    hillshadePrepare: {
        fragmentSource: require('../../build/min/glsl/hillshade_prepare.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/hillshade_prepare.vertex.glsl.txt')
    },
    hillshade: {
        fragmentSource: require('../../build/min/glsl/hillshade.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/hillshade.vertex.glsl.txt')
    },
    line: {
        fragmentSource: require('../../build/min/glsl/line.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/line.vertex.glsl.txt')
    },
    lineGradient: {
        fragmentSource: require('../../build/min/glsl/line_gradient.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/line_gradient.vertex.glsl.txt')
    },
    linePattern: {
        fragmentSource: require('../../build/min/glsl/line_pattern.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/line_pattern.vertex.glsl.txt')
    },
    lineSDF: {
        fragmentSource: require('../../build/min/glsl/line_sdf.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/line_sdf.vertex.glsl.txt')
    },
    raster: {
        fragmentSource: require('../../build/min/glsl/raster.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/raster.vertex.glsl.txt')
    },
    symbolIcon: {
        fragmentSource: require('../../build/min/glsl/symbol_icon.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/symbol_icon.vertex.glsl.txt')
    },
    symbolSDF: {
        fragmentSource: require('../../build/min/glsl/symbol_sdf.fragment.glsl.txt'),
        vertexSource: require('../../build/min/glsl/symbol_sdf.vertex.glsl.txt')
    }
};

// Expand #pragmas to #ifdefs.

const re = /#pragma mapbox: ([\w]+) ([\w]+) ([\w]+) ([\w]+)/g;

for (const programName in shaders) {
    const program = shaders[programName];
    const fragmentPragmas = {};

    program.fragmentSource = program.fragmentSource.replace(re, (match, operation, precision, type, name) => {
        fragmentPragmas[name] = true;
        if (operation === 'define') {
            return `
#ifndef HAS_UNIFORM_u_${name}
varying ${precision} ${type} ${name};
#else
uniform ${precision} ${type} u_${name};
#endif
`;
        } else /* if (operation === 'initialize') */ {
            return `
#ifdef HAS_UNIFORM_u_${name}
    ${precision} ${type} ${name} = u_${name};
#endif
`;
        }
    });

    program.vertexSource = program.vertexSource.replace(re, (match, operation, precision, type, name) => {
        const attrType = type === 'float' ? 'vec2' : 'vec4';
        if (fragmentPragmas[name]) {
            if (operation === 'define') {
                return `
#ifndef HAS_UNIFORM_u_${name}
uniform lowp float a_${name}_t;
attribute ${precision} ${attrType} a_${name};
varying ${precision} ${type} ${name};
#else
uniform ${precision} ${type} u_${name};
#endif
`;
            } else /* if (operation === 'initialize') */ {
                return `
#ifndef HAS_UNIFORM_u_${name}
    ${name} = unpack_mix_${attrType}(a_${name}, a_${name}_t);
#else
    ${precision} ${type} ${name} = u_${name};
#endif
`;
            }
        } else {
            if (operation === 'define') {
                return `
#ifndef HAS_UNIFORM_u_${name}
uniform lowp float a_${name}_t;
attribute ${precision} ${attrType} a_${name};
#else
uniform ${precision} ${type} u_${name};
#endif
`;
            } else /* if (operation === 'initialize') */ {
                return `
#ifndef HAS_UNIFORM_u_${name}
    ${precision} ${type} ${name} = unpack_mix_${attrType}(a_${name}, a_${name}_t);
#else
    ${precision} ${type} ${name} = u_${name};
#endif
`;
            }
        }
    });
}

module.exports = shaders;
