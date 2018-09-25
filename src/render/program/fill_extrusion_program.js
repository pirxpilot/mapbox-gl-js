const { patternUniformValues } = require('./pattern');
const { Uniform1i, Uniform1f, Uniform2f, Uniform3f, Uniform4f, UniformMatrix4f } = require('../uniform_binding');

const { mat3, vec3, mat4 } = require('@mapbox/gl-matrix');

const fillExtrusionUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_lightpos: new Uniform3f(context, locations.u_lightpos),
  u_lightintensity: new Uniform1f(context, locations.u_lightintensity),
  u_lightcolor: new Uniform3f(context, locations.u_lightcolor),
  u_vertical_gradient: new Uniform1f(context, locations.u_vertical_gradient)
});

const fillExtrusionPatternUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_lightpos: new Uniform3f(context, locations.u_lightpos),
  u_lightintensity: new Uniform1f(context, locations.u_lightintensity),
  u_lightcolor: new Uniform3f(context, locations.u_lightcolor),
  u_vertical_gradient: new Uniform1f(context, locations.u_vertical_gradient),
  u_height_factor: new Uniform1f(context, locations.u_height_factor),
  u_image: new Uniform1i(context, locations.u_image),
  u_texsize: new Uniform2f(context, locations.u_texsize),
  u_pixel_coord_upper: new Uniform2f(context, locations.u_pixel_coord_upper),
  u_pixel_coord_lower: new Uniform2f(context, locations.u_pixel_coord_lower),
  u_scale: new Uniform4f(context, locations.u_scale),
  u_fade: new Uniform1f(context, locations.u_fade)
});

const extrusionTextureUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_world: new Uniform2f(context, locations.u_world),
  u_image: new Uniform1i(context, locations.u_image),
  u_opacity: new Uniform1f(context, locations.u_opacity)
});

const fillExtrusionUniformValues = (matrix, painter, shouldUseVerticalGradient) => {
  const light = painter.style.light;
  const _lp = light.properties.get('position');
  const lightPos = [_lp.x, _lp.y, _lp.z];
  const lightMat = mat3.create();
  if (light.properties.get('anchor') === 'viewport') {
    mat3.fromRotation(lightMat, -painter.transform.angle);
  }
  vec3.transformMat3(lightPos, lightPos, lightMat);

  const lightColor = light.properties.get('color');

  return {
    u_matrix: matrix,
    u_lightpos: lightPos,
    u_lightintensity: light.properties.get('intensity'),
    u_lightcolor: [lightColor.r, lightColor.g, lightColor.b],
    u_vertical_gradient: +shouldUseVerticalGradient
  };
};

const fillExtrusionPatternUniformValues = (matrix, painter, shouldUseVerticalGradient, coord, crossfade, tile) => {
  return Object.assign(
    fillExtrusionUniformValues(matrix, painter, shouldUseVerticalGradient),
    patternUniformValues(crossfade, painter, tile),
    {
      u_height_factor: -(2 ** coord.overscaledZ) / tile.tileSize / 8
    }
  );
};

const extrusionTextureUniformValues = (painter, layer, textureUnit) => {
  const matrix = mat4.create();
  mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);

  const gl = painter.context.gl;

  return {
    u_matrix: matrix,
    u_world: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    u_image: textureUnit,
    u_opacity: layer.paint.get('fill-extrusion-opacity')
  };
};

module.exports = {
  fillExtrusionUniforms,
  fillExtrusionPatternUniforms,
  extrusionTextureUniforms,
  fillExtrusionUniformValues,
  fillExtrusionPatternUniformValues,
  extrusionTextureUniformValues
};
