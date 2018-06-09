//

const mapboxgl = require('../src');
const accessToken = require('./lib/access_token');
mapboxgl.accessToken = accessToken;

window.mapboxglVersions = window.mapboxglVersions || [];
window.mapboxglBenchmarks = window.mapboxglBenchmarks || {};

const version = process.env.BENCHMARK_VERSION;
window.mapboxglVersions.push(version);

function register(Benchmark) {
    window.mapboxglBenchmarks[Benchmark.name] = window.mapboxglBenchmarks[Benchmark.name] || {};
    window.mapboxglBenchmarks[Benchmark.name][version] = new Benchmark();
}

const Layout = require('./benchmarks/layout');
const LayoutDDS = require('./benchmarks/layout_dds');
const Paint = require('./benchmarks/paint');
const PaintStates = require('./benchmarks/paint_states');
const LayerBenchmarks = require('./benchmarks/layers');
const Load = require('./benchmarks/map_load');
const Validate = require('./benchmarks/style_validate');
const StyleLayerCreate = require('./benchmarks/style_layer_create');
const QueryPoint = require('./benchmarks/query_point');
const QueryBox = require('./benchmarks/query_box');
const ExpressionBenchmarks = require('./benchmarks/expressions');
const FilterCreate = require('./benchmarks/filter_create');
const FilterEvaluate = require('./benchmarks/filter_evaluate');

register(Layout);
register(LayoutDDS);
register(Paint);
register(PaintStates);
LayerBenchmarks.forEach(register);
register(Load);
register(Validate);
register(StyleLayerCreate);
register(QueryPoint);
register(QueryBox);
ExpressionBenchmarks.forEach(register);
register(FilterCreate);
register(FilterEvaluate);

const getWorkerPool = require('../src/util/global_worker_pool');

setTimeout(() => {
    // Ensure the global worker pool is never drained. Browsers have resource limits
    // on the max number of workers that can be created per page.
    // We do this async to avoid creating workers before the worker bundle blob
    // URL has been set up, which happens after this module is executed.
    getWorkerPool().acquire(-1);
}, 0);

module.exports = mapboxgl;

