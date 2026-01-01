const { create } = require('xmlbuilder2');

class RndKMessage {
    static build() {
        const rndkXml = create()
            .ele('msg')
            .att('t', 'sys')
            .ele('body')
            .att('action', 'rndK')
            .att('r', '-1')
            .txt('')
            .up()
            .up()
            .end({ headless: true });
        return rndkXml.replace(/"/g, '\'');
    }
}

module.exports = RndKMessage;
