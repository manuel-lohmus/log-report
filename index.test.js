/**  Copyright (c) Manuel Lõhmus (MIT License). */

"use strict";

const testRunner = require('./testRunner'),
    http = require('http'),
    createLogger = require('./index');


testRunner('Log Report > module loads and basic logging', { skip: false, timeout: 15000 }, (test, isPrimary, isWorker) => {

    test('module should load', { skip: false }, function (check, done) {

        check('log-report').mustBeDefined();
        done();
    });

    test('setup server', { skip: false }, function (check, done) {

        let counter = 0, 
            PORT = 5985,
            PATH = '/log-report',
            server = http.createServer((req, res) => {
            if (req.url === PATH && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {

                    try {
                        counter++;
                        const logEntry = JSON.parse(body);
                        check('logEntry', logEntry).mustBeObject();
                        check('logEntry.message', logEntry.message).mustBeDefined();
                        check('logEntry.@timestamp', logEntry['@timestamp']).mustBeDefined();
                        check('logEntry.log', logEntry.log).mustBeDefined();
                        check('logEntry.log.level', logEntry.log.level).mustBeDefined();
                        check('logEntry.log.logger', logEntry.log.logger).mustBe('test', 'std', 'UncaughtException');

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ ok: true }));

                        if (logEntry.message === 'Test exception to check uncaughtException logging' && counter >= 11) {
                            done();
                        }
                    }
                    catch (e) {
                        res.writeHead(400);
                        res.end(e.message);
                        done(e.message);
                    }
                });

                return;
            }

            res.writeHead(404);
            res.end('Not Found');
        });
        server.listen(PORT, function () {

            test('basic logging', { skip: false }, function (check, done) {

                const log = createLogger('test', {
                    logMode: 'dev',                         // includes dev-style logs so trace is visible
                    outputJSON: false,                      // human-readable
                    saveOnlyUncaughtException: false,       // enable stdout/stderr hooks
                    outputUri: 'http://localhost:5985/log-report',
                    logDir: './logs/log-report',
                    clearOnStartup: true,                   // start clean
                    addProcessTag: true,                    // adds process.pid
                    addFileTag: true,                       // adds log.origin.file.name
                    silent: false                           // also print to console
                });
                check(log).mustBeDefined();
                console.info('Console info log');
                console.log('Console log');
                console.warn('Console warn log');
                console.error('Console error log');
                log.info('Info log');
                log.warn('Warn log');
                log.error('Error log');
                log.debug('Debug log');
                log.trace('Trace log');
                log.fatal('Fatal log');
                // uncaughtException test
                setTimeout(() => {
                    done();
                    throw new Error('Test exception to check uncaughtException logging');
                }, 500); // wait a bit to ensure previous logs are sent first
            });
        });
    });
});