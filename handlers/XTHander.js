const clc = require('cli-color');

class XTHandler {
    constructor(controller) {
        this.controller = controller;
    }

    handle(action, parts) {
        switch(action) {
            case 'rp':
                this.#handleRoomProperties(parts);
                break;
        }   
    }

    #handleRoomProperties(parts) {
        const roomid = parts[3];
        this.controller.Log(`updated roomid: ` + clc.green(roomid));
        this.controller.roomid = roomid;
    }
}

module.exports = XTHandler;
