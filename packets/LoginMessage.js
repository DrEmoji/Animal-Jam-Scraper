const { createHmac } = require('node:crypto');
const { create } = require('xmlbuilder2');

class LoginMessage {
    static build(options) {
        const loginXml = create()
            .ele('login')
            .att('z', 'sbiLogin')
            .ele('nick')
            .dat(`${options.username}%%0%${options.deploy_version}%PlugIn%32.0,0,403%WIN%0`)
            .up()
            .ele('pword')
            .dat(options.auth_token)
            .up();

        const hash = createHmac('sha256', options.hash)
            .update(loginXml.toString({ headless: true }))
            .digest('base64');

        const msgXml = create()
            .ele('msg')
            .att('t', 'sys')
            .ele('body')
            .att('action', 'login')
            .att('r', '0')
            .import(loginXml)
            .up()
            .att('h', hash);

        return msgXml.end({ headless: true });
    }
}

module.exports = LoginMessage;
