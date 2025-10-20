'use strict';

// Dev-friendly text output with color, showing trace/debug and redirect hooks.
const createLogger = require('log-report');

const log = createLogger('payments', {
    logMode: 'dev',                         // includes dev-style logs so trace is visible
    outputJSON: false,                      // human-readable text mode
    baseFields: {
        'ECS.version': '1.12.0',            // ECS version
        service: { name: 'payment-service' }// ECS service.name
    },
    saveOnlyUncaughtException: false,       // enable stdout/stderr hooks
    logDir: './logs/log-report',
    clearOnStartup: true,                   // start clean
    addProcessTag: true,                    // adds process.pid
    addFileTag: true,                       // adds log.origin.file.name
    silent: false                           // also print to console
});

log.debug('Starting payment workflow', { mode: 'sandbox' });
log.trace('Authorize call', { traceId: 't-001', spanId: 's-001', amount: 19.99 });
log.info('Payment completed', { orderId: 'A1001' });
log.warn('Slow response from PSP', { latency_ms: 850 });
log.error('Refund failed', { code: 'REFUND_42' });

console.log('stdout redirected');
console.warn('stderr redirected (warn)');
console.error('stderr redirected (error)');

// Uncomment to see fatal + exit
// setTimeout(() => { throw new Error('Uncaught exception in dev'); }, 800);