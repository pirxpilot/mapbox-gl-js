const replace = require('rollup-plugin-replace');
const {plugins: basePlugins} = require('../build/rollup_plugins');

const plugins = () => basePlugins().concat(
    replace({
        'process.env.BENCHMARK_VERSION': JSON.stringify(process.env.BENCHMARK_VERSION),
        'process.env.MAPBOX_ACCESS_TOKEN': JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
        'process.env.MapboxAccessToken': JSON.stringify(process.env.MapboxAccessToken),
        // should we rewrite this as 'production' if BUILD==='production'?
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
);

const config = [{
    input: 'bench/benchmarks_view.js',
    output: {
        file: 'bench/benchmarks_view_generated.js',
        format: 'umd',
        sourcemap: 'inline'
    },
    plugins: plugins()
}];

module.exports = config;

