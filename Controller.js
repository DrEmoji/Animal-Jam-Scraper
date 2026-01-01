const { EventEmitter } = require('node:events');
const { createConnection } = require('node:net');
const { connect: tlsConnect } = require('node:tls');
const RndKMessage = require('./packets/RndKMessage.js');
const clc = require('cli-color');
const { HttpsProxyAgent } = require('https-proxy-agent'); 
const { DelimiterTransform } = require('./utils/Delimiter-Transform.js');
const PacketHandler = require('./handlers/PacketHandler.js');
const { ANIMAL_JAM_BASE_URL } = require('./utils/Constants.js')
const axios = require("axios");

class NetworkController extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.roomid = "-1";
        this.userData = {};
        this.packetHandler = new PacketHandler(this);
        this.socket = null;
    }

    Log(message) {
        console.log(clc.red(`[${this.options.username}]`), message);
    }

    async connect() {
        let data;
        if (this.options.proxy) {
            const proxyUrl = `http://${this.options.proxy.username}:${encodeURIComponent(this.options.proxy.password)}@${this.options.proxy.host}:${this.options.proxy.port}`;
            const httpsAgent = new HttpsProxyAgent(proxyUrl);
            const response = await axios.get(`${ANIMAL_JAM_BASE_URL}/flashvars`, {
                httpsAgent: httpsAgent,
                timeout: 10000,
            });
            data = response.data
        }
        else {
            const response = await axios.get(`${ANIMAL_JAM_BASE_URL}/flashvars`);
            data = response.data
        } 
        this.options.host = `lb-${data.smartfoxServer}`;
        this.options.port = Number(data.smartfoxPort);
        this.options.deploy_version = Number(data.deploy_version);
        try {
            if (this.options.proxy)
                await this.createProxyConnection();
            else
                await this.createConnection();


            this.socket
                .pipe(new DelimiterTransform(0x00))
                .on('data', (data) => {
                    this.packetHandler.handle(data);
                    this.emit('received', data)
                })
                .on('close', () => {
                    this.emit('close');
                })
                .on('error', err => this.emit('error', err));

            if (this.socket) {
                this.socket.setMaxListeners(0);
            }
        } catch (err) {
            throw err;
        }
        await this.sendRawMessage(RndKMessage.build());
    }

   async sendRawMessage(message) {
        return this.socket.write(message + "\x00");
    }

    async sendXTMessage(args) {
        const message = `%xt%o%${args.join('%')}%`;
        return await this.sendRawMessage(message);
    }

    async sendXMLMessage(args) {
        const message = `<msg t="sys"><body action="pubMsg" r="${this.roomid}"><txt><![CDATA[${args.join('%')}]]></txt></body></msg>`;
       return await this.sendRawMessage(message);
    }


    waitForXT(action, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const onPacket = (data) => {
                const packet = data.toString();

                if (!packet.includes('%xt%')) return;

                const parts = packet.split('%');
                if (parts[1] === 'xt' && parts[2] === action) {
                    cleanup();
                    resolve(parts);
                }
            };

            const onTimeout = () => {
                cleanup();
                reject(new Error(`waitForXT timeout for action: ${action}`));
            };

            const cleanup = () => {
                clearTimeout(timer);
                this.removeListener('received', onPacket);
            };

            this.on('received', onPacket);
            const timer = setTimeout(onTimeout, timeout);
        });
    }

    createConnectRequest(host, port, includeHostHeader = true) {
        const lines = [
            `CONNECT ${host}:${port} HTTP/1.1`,
            includeHostHeader ? `Host: ${host}:${port}` : '',
            `ServerName: ${host}`,
            'Proxy-Connection: Keep-Alive',
        ];

        if (this.options.proxy?.username && this.options.proxy?.password) {
            const encoded = Buffer.from(`${this.options.proxy.username}:${this.options.proxy.password}`).toString('base64');
            lines.push(`Proxy-Authorization: Basic ${encoded}`);
        }

        lines.push('', '');
        return lines.join('\r\n');
    }

    handleSocketResponse(buffer) {
        const response = buffer.toString();
        const statusLine = response.split('\r\n')[0];
         const match = statusLine.match(/^HTTP\/\d\.\d (\d{3})/);
        if (!match) {
            throw new Error('Invalid proxy response');
        }
        return { statusCode: parseInt(match[1], 10) };
    }

    async createProxyConnection() {
        return new Promise((resolve, reject) => {
            const proxySocket = createConnection({
                host: this.options.proxy?.host,
                port: this.options.proxy?.port,
            });

            const cleanUp = () => {
                proxySocket.removeAllListeners();
                this.socket?.removeAllListeners();
            };

            proxySocket.once('connect', () => {
                const connectRequest = this.createConnectRequest(this.options.host, this.options.port, true);
                proxySocket.write(connectRequest);
            });

            proxySocket.once('data', (data) => {
                try {
                    const { statusCode } = this.handleSocketResponse(data);
                    if (statusCode === 200) {
                        this.socket = tlsConnect({
                            socket: proxySocket,
                            host: this.options.host,
                            port: this.options.port,
                            servername: this.options.host,
                            rejectUnauthorized: false,
                        });

                        const onConnect = () => {
                            cleanUp();
                            resolve();
                        };

                        this.socket.once('secureConnect', onConnect);
                        this.socket.once('connect', onConnect);
                        this.socket.once('error', (err) => {
                            cleanUp();
                            reject(err);
                        });
                    } else {
                        cleanUp();
                        reject(new Error(`Proxy connection failed with status code ${statusCode}`));
                    }
                } catch (err) {
                    cleanUp();
                    reject(err);
                }
            });


            proxySocket.once('error', (err) => {
                this.emit('error', err);
                cleanUp();
                reject(err);
            });

            proxySocket.once('close', () => {
                cleanUp();
                reject(new Error('Proxy socket closed unexpectedly'));
            });
        });
    }

    async createConnection() {
        this.socket = tlsConnect({
            host: this.options.host,
            port: this.options.port,
            servername: this.options.host,
            rejectUnauthorized: false,
        });

        return new Promise((resolve, reject) => {
            const onConnect = () => {
                this.socket.removeListener('error', reject);
                resolve();
            };
            const onError = (err) => {
                this.socket.removeListener('secureConnect', onConnect);
                this.socket.removeListener('connect', onConnect);
                reject(err);
            };
            this.socket.once('secureConnect', onConnect);
            this.socket.once('connect', onConnect);
            this.socket.once('error', onError);
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.socket.end();
            this.socket.once('close', () => resolve());
            this.socket.once('error', reject);
        });
    }
}

module.exports = {
    NetworkController
};
