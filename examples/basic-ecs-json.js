'use strict';

// Basic ECS JSON logging example.
const createLogger = require('log-report'),
    configSets = require("config-sets");

/* Example configSets setup (optional):
// Configure
createLogger.logMode = 'dev';                      // includes dev-style logs so trace is visible
createLogger.outputJSON = true;                    // ECS-compatible JSON lines
createLogger.saveOnlyUncaughtException = false;    // enable stdout/stderr hooks
createLogger.logDir = './logs/log-report';
createLogger.stdoutFileName = 'stdout.log';
createLogger.stderrFileName = 'stderr.log';
createLogger.exceptionFileName = 'exception.log';
createLogger.clearOnStartup = true;                // start clean
createLogger.addProcessTag = true;                 // adds process.pid
createLogger.addFileTag = true;                    // adds log.origin.file.name
createLogger.silent = false;                       // also print to console
*/

/* Example configSets usage:
// Create a logger instance for a specific module
const log = createLogger('orders', { 
    logMode: 'dev',
    outputJSON: true,
    saveOnlyUncaughtException: false,
    clearOnStartup: true,
    addProcessTag: true,
    addFileTag: true,
    silent: false
});
*/

// Recommended solution: use configSets to manage configurations
// (see https://www.npmjs.com/package/config-sets for details)
// Create a logger instance for a specific module using configSets
const log = createLogger('orders', configSets('module:log-report'));

// App logs
log.info('Service started');
log.warn('Cache miss', { key: 'user:42' });
log.error(new Error('DB connection failed'));

// Trace example (visible due to logMode 'dev' or 'combined')
log.trace('HTTP request handled', { route: '/health', status: 200, traceId: 'abc123', spanId: 'def456' });

// Redirected console (stdout/stderr are hooked)
console.log('Console says hello');
console.warn('Console warning');
console.error('Console error');

// Uncomment to see uncaught exception handling -> fatal + process exit
setTimeout(() => { throw new Error('Uncaught Exception demo'); }, 5007);