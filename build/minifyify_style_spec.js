const { Transform, PassThrough } = require('stream');

function replacer(k, v) {
    return (k === 'doc' || k === 'example' || k === 'sdk-support') ? undefined : v;
}

module.exports = (path) => {
    if (path.match(/style\-spec[\\/]reference[\\/]v[0-9]+\.json$/)) {
        const chunks = [];
        return new Transform({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            },
            flush(callback) {
                const source = chunks.map(c =>  c.toString('utf8')).join('');
                this.push(JSON.stringify(JSON.parse(source), replacer, 0));
                callback();
            }
        });
    } else {
        return new PassThrough();
    }
};
