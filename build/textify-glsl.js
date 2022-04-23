const { Transform, PassThrough } = require('stream');

module.exports = path => {
    if (path.endsWith('.glsl')) {
        let first = true;
        return new Transform({
            write(chunk, encoding, callback) {
                if (first) {
                    this.push('module.exports = raw`');
                    first = false;
                }
                this.push(chunk.toString('utf8'));
                callback();
            },
            flush(callback) {
                this.push('`;');
                callback();
            }
        });
    } else {
        return new PassThrough();
    }
};
