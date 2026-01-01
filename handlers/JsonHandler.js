const clc = require('cli-color');

class XTHandler {
    constructor(controller) {
        this.controller = controller;
    }

    handle(params) {
        switch (true) {
            case params.hasOwnProperty('dbUserId'): {
                this.#handleUserData(params);
                break;
            }
        }
    }

    #handleUserData(params) { 
        if (params.hasOwnProperty('playerWallSettings')) {
            this.controller.userData = params;
            this.controller.Log(clc.green("Login Packet Successful!"));
            this.controller.emit("ready");
        }
        else {
            this.controller.Log(clc.redBright("Auth Packet Failed!!"));
        }
    }
}

module.exports = XTHandler;
