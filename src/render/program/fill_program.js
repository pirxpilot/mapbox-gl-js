const { patternUniformValues } = require('./pattern');
const { Uniform1i, Uniform1f, Uniform2f, UniformMatrix4f } = require('../uniform_binding');

const fillUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix)
});

const fillPatternUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_image: new Uniform1i(context, locations.u_image),
  u_pattern_tl_a: new Uniform2f(context, locations.u_pattern_tl_a),
  u_pattern_br_a: new Uniform2f(context, locations.u_pattern_br_a),
  u_pattern_tl_b: new Uniform2f(context, locations.u_pattern_tl_b),
  u_pattern_br_b: new Uniform2f(context, locations.u_pattern_br_b),
  u_texsize: new Uniform2f(context, locations.u_texsize),
  u_mix: new Uniform1f(context, locations.u_mix),
  u_pattern_size_a: new Uniform2f(context, locations.u_pattern_size_a),
  u_pattern_size_b: new Uniform2f(context, locations.u_pattern_size_b),
  u_scale_a: new Uniform1f(context, locations.u_scale_a),
  u_scale_b: new Uniform1f(context, locations.u_scale_b),
  u_pixel_coord_upper: new Uniform2f(context, locations.u_pixel_coord_upper),
  u_pixel_coord_lower: new Uniform2f(context, locations.u_pixel_coord_lower),
  u_tile_units_to_pixels: new Uniform1f(context, locations.u_tile_units_to_pixels)
});

const fillOutlineUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_world: new Uniform2f(context, locations.u_world)
});

const fillOutlinePatternUniforms = (context, locations) => ({
  u_matrix: new UniformMatrix4f(context, locations.u_matrix),
  u_world: new Uniform2f(context, locations.u_world),
  u_image: new Uniform1i(context, locations.u_image),
  u_pattern_tl_a: new Uniform2f(context, locations.u_pattern_tl_a),
  u_pattern_br_a: new Uniform2f(context, locations.u_pattern_br_a),
  u_pattern_tl_b: new Uniform2f(context, locations.u_pattern_tl_b),
  u_pattern_br_b: new Uniform2f(context, locations.u_pattern_br_b),
  u_texsize: new Uniform2f(context, locations.u_texsize),
  u_mix: new Uniform1f(context, locations.u_mix),
  u_pattern_size_a: new Uniform2f(context, locations.u_pattern_size_a),
  u_pattern_size_b: new Uniform2f(context, locations.u_pattern_size_b),
  u_scale_a: new Uniform1f(context, locations.u_scale_a),
  u_scale_b: new Uniform1f(context, locations.u_scale_b),
  u_pixel_coord_upper: new Uniform2f(context, locations.u_pixel_coord_upper),
  u_pixel_coord_lower: new Uniform2f(context, locations.u_pixel_coord_lower),
  u_tile_units_to_pixels: new Uniform1f(context, locations.u_tile_units_to_pixels)
});

const fillUniformValues = matrix => ({
  u_matrix: matrix
});

const fillPatternUniformValues = (matrix, painter, image, tile) =>
  Object.assign(fillUniformValues(matrix), patternUniformValues(image, painter, tile));

const fillOutlineUniformValues = (matrix, drawingBufferSize) => ({
  u_matrix: matrix,
  u_world: drawingBufferSize
});

const fillOutlinePatternUniformValues = (matrix, painter, image, tile, drawingBufferSize) =>
  Object.assign(fillPatternUniformValues(matrix, painter, image, tile), {
    u_world: drawingBufferSize
  });

module.exports = {
  fillUniforms,
  fillPatternUniforms,
  fillOutlineUniforms,
  fillOutlinePatternUniforms,
  fillUniformValues,
  fillPatternUniformValues,
  fillOutlineUniformValues,
  fillOutlinePatternUniformValues
};
