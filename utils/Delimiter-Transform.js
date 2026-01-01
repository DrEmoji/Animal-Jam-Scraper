const { Transform } = require('stream');

class DelimiterTransform extends Transform {
    constructor(delimiter, options = {}) {
        super({
            ...options,
            readableObjectMode: true,
        });
        this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : Buffer.from([delimiter]);
        this.buffer = Buffer.alloc(0);
    }

    _transform(chunk, encoding, callback) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        let delimiterIndex;

        while ((delimiterIndex = this.buffer.indexOf(this.delimiter)) !== -1) {
            const data = this.buffer.slice(0, delimiterIndex);
            this.buffer = this.buffer.slice(delimiterIndex + this.delimiter.length);
            this.push(data);
        }

        callback();
    }

    _flush(callback) {
        if (this.buffer.length > 0) {
            this.push(this.buffer);
        }
        callback();
    }
}

module.exports = {
    DelimiterTransform
};
