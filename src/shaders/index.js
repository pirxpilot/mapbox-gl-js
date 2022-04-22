'use strict';

const shaders = {
    prelude: {
        fragmentSource: require('../shaders/_prelude.fragment.glsl'),
        vertexSource: require('../shaders/_prelude.vertex.glsl')
    },
    background: {
        fragmentSource: require('../shaders/background.fragment.glsl'),
        vertexSource: require('../shaders/background.vertex.glsl')
    },
    backgroundPattern: {
        fragmentSource: require('../shaders/background_pattern.fragment.glsl'),
        vertexSource: require('../shaders/background_pattern.vertex.glsl')
    },
    circle: {
        fragmentSource: require('../shaders/circle.fragment.glsl'),
        vertexSource: require('../shaders/circle.vertex.glsl')
    },
    clippingMask: {
        fragmentSource: require('../shaders/clipping_mask.fragment.glsl'),
        vertexSource: require('../shaders/clipping_mask.vertex.glsl')
    },
    heatmap: {
        fragmentSource: require('../shaders/heatmap.fragment.glsl'),
        vertexSource: require('../shaders/heatmap.vertex.glsl')
    },
    heatmapTexture: {
        fragmentSource: require('../shaders/heatmap_texture.fragment.glsl'),
        vertexSource: require('../shaders/heatmap_texture.vertex.glsl')
    },
    collisionBox: {
        fragmentSource: require('../shaders/collision_box.fragment.glsl'),
        vertexSource: require('../shaders/collision_box.vertex.glsl')
    },
    collisionCircle: {
        fragmentSource: require('../shaders/collision_circle.fragment.glsl'),
        vertexSource: require('../shaders/collision_circle.vertex.glsl')
    },
    debug: {
        fragmentSource: require('../shaders/debug.fragment.glsl'),
        vertexSource: require('../shaders/debug.vertex.glsl')
    },
    fill: {
        fragmentSource: require('../shaders/fill.fragment.glsl'),
        vertexSource: require('../shaders/fill.vertex.glsl')
    },
    fillOutline: {
        fragmentSource: require('../shaders/fill_outline.fragment.glsl'),
        vertexSource: require('../shaders/fill_outline.vertex.glsl')
    },
    fillOutlinePattern: {
        fragmentSource: require('../shaders/fill_outline_pattern.fragment.glsl'),
        vertexSource: require('../shaders/fill_outline_pattern.vertex.glsl')
    },
    fillPattern: {
        fragmentSource: require('../shaders/fill_pattern.fragment.glsl'),
        vertexSource: require('../shaders/fill_pattern.vertex.glsl')
    },
    fillExtrusion: {
        fragmentSource: require('../shaders/fill_extrusion.fragment.glsl'),
        vertexSource: require('../shaders/fill_extrusion.vertex.glsl')
    },
    fillExtrusionPattern: {
        fragmentSource: require('../shaders/fill_extrusion_pattern.fragment.glsl'),
        vertexSource: require('../shaders/fill_extrusion_pattern.vertex.glsl')
    },
    extrusionTexture: {
        fragmentSource: require('../shaders/extrusion_texture.fragment.glsl'),
        vertexSource: require('../shaders/extrusion_texture.vertex.glsl')
    },
    hillshadePrepare: {
        fragmentSource: require('../shaders/hillshade_prepare.fragment.glsl'),
        vertexSource: require('../shaders/hillshade_prepare.vertex.glsl')
    },
    hillshade: {
        fragmentSource: require('../shaders/hillshade.fragment.glsl'),
        vertexSource: require('../shaders/hillshade.vertex.glsl')
    },
    line: {
        fragmentSource: require('../shaders/line.fragment.glsl'),
        vertexSource: require('../shaders/line.vertex.glsl')
    },
    lineGradient: {
        fragmentSource: require('../shaders/line_gradient.fragment.glsl'),
        vertexSource: require('../shaders/line_gradient.vertex.glsl')
    },
    linePattern: {
        fragmentSource: require('../shaders/line_pattern.fragment.glsl'),
        vertexSource: require('../shaders/line_pattern.vertex.glsl')
    },
    lineSDF: {
        fragmentSource: require('../shaders/line_sdf.fragment.glsl'),
        vertexSource: require('../shaders/line_sdf.vertex.glsl')
    },
    raster: {
        fragmentSource: require('../shaders/raster.fragment.glsl'),
        vertexSource: require('../shaders/raster.vertex.glsl')
    },
    symbolIcon: {
        fragmentSource: require('../shaders/symbol_icon.fragment.glsl'),
        vertexSource: require('../shaders/symbol_icon.vertex.glsl')
    },
    symbolSDF: {
        fragmentSource: require('../shaders/symbol_sdf.fragment.glsl'),
        vertexSource: require('../shaders/symbol_sdf.vertex.glsl')
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
