'use strict';

// Demonstrates file rotation + gzip compression by writing >1MB and then continuing,
// so the next batch triggers rotation before append.
const createLogger = require('log-report');

const log = createLogger('bulk-writer', {
    logMode: 'short',
    outputJSON: false,
    saveOnlyUncaughtException: false,
    logDir: './logs/rotate-demo',
    stdoutFileName: 'stdout.log',
    clearOnStartup: true,
    silent: true, // avoid spamming console
    //compressEnabled: false, // disable compression
});

// First batch: fills the file >1MB (buffered, flushed immediately)
const TARGET1 = 20000;
for (let i = 0; i < TARGET1; i++) {
    log.info('Filling log for rotation (batch1)', { seq: i, filler: 'xxxxxxxxxxxxxxxxxxxxxxxx' });
}

// Second batch after a short delay: triggers rotation before appending this batch
setTimeout(() => {
    const TARGET2 = 2000;
    for (let i = 0; i < TARGET2; i++) {
        log.info('Filling log for rotation (batch2)', { seq: TARGET1 + i, filler: 'yyyyyyyyyyyyyyyyyyyyyyyy' });
    }

    console.log('Wrote many entries. Check ./logs/rotate-demo for *.gz rotated files when compression is enabled.');
}, 1000);