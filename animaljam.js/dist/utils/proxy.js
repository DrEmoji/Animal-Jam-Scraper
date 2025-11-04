export function handleSocketResponse(data) {
    const responseString = data.toString('utf-8');
    const [statusLine] = responseString.split('\r\n');
    const [_, statusCode, statusMessage] = statusLine.split(' ');
    return {
        statusCode: parseInt(statusCode, 10),
        statusMessage: statusMessage || ''
    };
}

export function createConnectRequest(targetHost, targetPort, keepAlive = false) {
    const request = [
        `CONNECT ${targetHost}:${targetPort} HTTP/1.1`,
        `Host: ${targetHost}`,
        `ServerName: ${targetHost}`,
        keepAlive && 'Proxy-Connection: Keep-Alive',
        keepAlive && 'Connection: Keep-Alive',
        '\r\n'
    ].join('\r\n');

    return Buffer.from(request);
}