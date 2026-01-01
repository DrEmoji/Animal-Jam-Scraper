const LoginMessage = require('../packets/LoginMessage');

class XMLHandler {
    constructor(controller) {
        this.controller = controller;
    }

    handle(action, body) {
        switch (action) {
            case 'rndK':
                this.#handleRndK(body);
                break;
        }
    }

    #handleRndK(body) {
        const hash = body.k?.[0];
        this.controller.options.hash = hash;
        this.controller.sendRawMessage(LoginMessage.build(this.controller.options));
    }
}

module.exports = XMLHandler;
