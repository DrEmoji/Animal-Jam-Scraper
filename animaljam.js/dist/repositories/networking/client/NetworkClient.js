import { EventEmitter } from 'node:events';
import { createConnection } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { createConnectRequest, handleSocketResponse } from '../../../utils/proxy.js';
import { DelimiterTransform } from '../transform/index.js';
export class NetworkClient extends EventEmitter {
    options;
    socket = null;
    reconnectAttempts = 0;
    reconnecting = false;
    constructor(options) {
        super();
        this.options = options;
    }
    async connect() {
        try {
            if (this.options.proxy)
                await this.createProxyConnection();
            else
                await this.createConnection();
            this.reconnectAttempts = 0;
            this.reconnecting = false;
            this.socket
                .pipe(new DelimiterTransform(0x00))
                .on('data', data => this.emit('received', data))
                .on('close', () => {
                this.emit('close');
                if (this.options.reconnect && !this.reconnecting) {
                    this.attemptReconnect();
                }
            })
                .on('error', err => this.emit('error', err));
        }
        catch (err) {
            if (this.options.reconnect && !this.reconnecting) {
                this.emit('connect_error', err);
                this.attemptReconnect();
                return;
            }
            throw err;
        }
    }
    async write(message) {
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                this.socket.off('error', onError);
                this.socket.off('close', onClose);
            };
            const onError = (err) => {
                cleanup();
                reject(err);
            };
            const onClose = () => {
                cleanup();
                reject(new Error('Socket closed before the message could be sent'));
            };
            this.socket.once('error', onError);
            this.socket.once('close', onClose);
            const writable = this.socket.write(message) && this.socket.write('\x00');
            if (writable) {
                cleanup();
                resolve(message.length);
            }
            else {
                this.socket.once('drain', () => {
                    cleanup();
                    resolve(message.length);
                });
            }
        });
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
                proxySocket.write(createConnectRequest(this.options.host, this.options.port, true));
            });
            proxySocket.once('data', (data) => {
                try {
                    const { statusCode } = handleSocketResponse(data);
                    if (statusCode === 200) {
                        this.socket =
                            this.options.domain === 'mobile'
                                ? proxySocket
                                : tlsConnect({
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
                    }
                    else {
                        cleanUp();
                        reject(new Error(`Proxy connection failed with status code ${statusCode}`));
                    }
                }
                catch (err) {
                    cleanUp();
                    reject(err);
                }
            });
            proxySocket.once('error', (err) => {
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
        const connectionOptions = {
            host: this.options.host,
            port: this.options.port,
            servername: this.options.host,
            rejectUnauthorized: false
        };
        this.socket =
            this.options.domain === 'mobile'
                ? createConnection(connectionOptions)
                : tlsConnect({
                    ...connectionOptions,
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
    attemptReconnect() {
        if (this.reconnecting)
            return;
        const maxAttempts = this.options.maxReconnectAttempts ?? 5;
        const delay = this.options.reconnectDelay ?? 1000;
        if (this.reconnectAttempts >= maxAttempts) {
            this.emit('reconnect_failed', new Error(`Failed to reconnect after ${maxAttempts} attempts`));
            return;
        }
        this.reconnecting = true;
        this.reconnectAttempts++;
        const backoff = delay * Math.pow(1.5, this.reconnectAttempts - 1) * (1 + Math.random() * 0.1);
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay: backoff });
        setTimeout(async () => {
            try {
                await this.connect();
                this.reconnecting = false;
                this.emit('reconnect');
            }
            catch (err) {
                this.reconnecting = false;
                this.emit('reconnect_error', err);
                this.attemptReconnect();
            }
        }, backoff);
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.socket.end();
            this.socket.once('close', () => resolve());
            this.socket.once('error', reject);
        });
    }
}
