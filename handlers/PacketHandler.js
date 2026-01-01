const XTHandler = require('./XTHander.js');
const XMLHandler = require('./XMLHander.js');
const JsonHandler = require('./JsonHandler.js');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

class PacketHandler {
    constructor(controller) {
        this.controller = controller;
        this.xtHandler = new XTHandler(controller);
        this.xmlHandler = new XMLHandler(controller);
        this.jsonHandler = new JsonHandler(controller);
    }

    handle(data) {
        const packet = data.toString();
        switch (true) {
            case packet.includes('%'): {
                const parts = packet.split('%');
                const action = parts[2];
                this.xtHandler.handle(action, parts);
                break;
            }

            case packet.includes('<'): {
                parser.parseString(packet, (err, result) => {
                    if (err) {
                        console.error('XML parse error:', err);
                        return;
                    }

                    const body = result.msg?.body?.[0];
                    const action = body?.$?.action;
                    this.xmlHandler.handle(action, body);
                 });
                break;
            }

            case packet.includes('{'): {
                try {
                    const json = JSON.parse(packet);
                    this.jsonHandler.handle(json.b?.o?.params);
                } catch (err) {
                    console.error('Failed to parse JSON packet:', err, packet);
                }
                break;
            }

            default:
                console.warn('Unknown packet type:', packet);
        }
    }
}

module.exports = PacketHandler;
