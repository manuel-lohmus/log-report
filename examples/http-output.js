'use strict';

// Sends logs to an HTTP endpoint (in-process demo server) and to files.
const http = require('http');
const createLogger = require('log-report');

const PORT = 5984;
const PATH = '/log-report';

// Minimal receiver for demonstration
const server = http.createServer((req, res) => {
    if (req.url === PATH && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            // For demo, just acknowledge
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });
        return;
    }
    res.writeHead(200);
    res.end('OK');
});

server.listen(PORT, async () => {

    console.log(`Demo server listening on http://localhost:${PORT}${PATH}`);
    // Create a logger instance
    const log = createLogger('delivery', {
        logMode: 'dev',                                 // includes dev-style logs so trace is visible
        outputJSON: true,                               // ECS-compatible JSON lines
        saveOnlyUncaughtException: false,               // enable stdout/stderr hooks
        outputUri: `http://localhost:${PORT}${PATH}`,   // our demo server
        logDir: './logs/log-report',
        clearOnStartup: true,                           // start clean
        addProcessTag: true,                            // adds process.pid
        addFileTag: true,                               // adds log.origin.file.name
        silent: false                                   // also print to console
    });
    log.info('HTTP output test started');
    log.trace('Queued delivery', { traceId: 'trk-123', orderId: 'A42' });
    log.error(new Error('Sample error for transport'));

    setTimeout(() => {
        console.log('Shutting down demo server...');
        server.close();
    }, 1000);
});