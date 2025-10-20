/**  Copyright (c) Manuel Lõhmus (MIT License). */

'use strict';

const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    zlib = require('zlib'),
    stdoutWrite = (function (write) { return function () { return write.apply(process.stdout, arguments); }; })(process.stdout.write),
    stderrWrite = (function (write) { return function () { return write.apply(process.stderr, arguments); }; })(process.stderr.write),
    logStd = createLogger('std'),
    // Buffered append implementation
    // One buffer per file, flushed immediately if idle and at most every 5s.
    fileBuffers = new Map(); // path -> { queue: Array<data>, writing: bool, timer: NodeJS.Timeout|null }
// Default options
var options = {
    '-metadata': [
        ` 'module:log-report' settings `,
        ` These settings configure the logging behavior of the application. `,
        ` Changes are applied in real time when new settings are saved to file. `
    ],
    '-metadata-logMode': [
        ` Log mode. Default: 'short' `,
        ` Example values: 'none', 'short', 'dev', 'combined' `,
        ` 'none' = disable all logging except uncaughtException to exception.log `,
        ` 'short' = info, warn, error, fatal to respective files (stdout.log, stderr.log, exception.log) `,
        ` 'dev' = like 'short' but also includes debug and trace to stdout.log (for development) `,
        ` 'combined' = like 'dev' but also includes http info (if provided in log.trace) to stdout (logs all) `,
        ` 'dev' and 'combined' are verbose and may include sensitive information, use with caution in production. `
    ],
    logMode: 'short',
    '-metadata-outputJSON': [
        ` Output format. Default: true (true = JSON format, false = text format) `,
        ` If false, the output format will be a human-readable text format. `,
        ` This is useful for development or debugging, but not recommended for production. `
    ],
    outputJSON: true,
    '-metadata-baseFields': [
        ` Base fields to include in every log entry. Default: {} `,
        ` This is useful for adding common fields to all log entries, such as environment or version. `,
        ` Example: { 'ecs.version': '8.11.0', environment: 'production' } `
    ],
    baseFields: {},
    '-metadata-outputUri': [
        ` Output URI. Default: '' (e.g. 'http://localhost:3000/logs') `,
        ` If set, logs will be sent to the specified URI via HTTP POST in JSON format. `,
        ` Ensure that the URI is reachable and can accept POST requests with JSON payloads. `,
        ` If empty, logs will only be written to log files. `
    ],
    outputUri: '',
    '-metadata-logDir': [
        ` Specifies the directory where logs will be saved. Default: './logs/log-report' `,
        ` Ensure that the directory exists or the application has permission to create it. `,
        ` Relative paths are resolved against the current working directory. `,
        ` Absolute paths are used as-is. (e.g. '/var/log/myapp') `
    ],
    logDir: './logs/log-report',
    '-metadata-stdoutFileName': [` Specify appropriate log file names. Default: 'stdout.log' `],
    stdoutFileName: 'stdout.log',
    '-metadata-stderrFileName': [` Specify appropriate log file names. Default: 'stderr.log' `],
    stderrFileName: 'stderr.log',
    '-metadata-exceptionFileName': [` Specify appropriate log file names. Default: 'exception.log' `],
    exceptionFileName: 'exception.log',
    '-metadata-clearOnStartup': [
        ` This is useful if you want to start with fresh log files, `,
        ` especially during development or testing. Default: true `
    ],
    clearOnStartup: true,
    '-metadata-saveOnlyUncaughtException': [` This is useful if you only want information about Uncaught Exception. Default: false `],
    saveOnlyUncaughtException: true,
    '-metadata-addProcessTag': [
        ` This is useful if you want to get information about the PID of a process, `,
        ` especially during development or testing. Default: false `,
        ` Note: In clustered environments, multiple processes may write to the same log file. `,
        ` Consider using 'addFileTag' for better traceability. `
    ],
    addProcessTag: false,
    '-metadata-addFileTag': [
        ` This is useful if you want to get information about the file that started the process, `,
        ` especially during development or testing. Default: false `,
        ` Note: In clustered environments, multiple processes may write to the same log file. `,
        ` This adds the 'log.origin.file.name' field to each log entry. `
    ],
    addFileTag: false,
    '-metadata-silent': [
        ` Suppresses terminal output when set to true. Default: false `,
        ` When false, log messages will be printed to the console in addition to being saved to log files. `,
        ` When true, log messages will only be saved to log files. `
    ],
    silent: false,
    '-metadata-loggingEnabled': [
        ` Enable or disable logging. Default: true `,
        ` When false, no logs will be written to files, but uncaught exceptions will still be handled. `,
        ` This can be useful for temporarily disabling logging without changing other settings. `
    ],
    loggingEnabled: true,
    '-metadata-compressEnabled': [
        ` Enable or disable gzip rotation over 1MB. Default: true `,
        ` When true, log files exceeding 1MB will be compressed using gzip to save disk space. `,
        ` When false, log files will grow indefinitely unless manually managed. `
    ],
    compressEnabled: true
};


Object.defineProperties(createLogger, {
    // options
    logMode: { get: function () { return options.logMode; }, set: function (val) { options.logMode = val + ''; options.resetChanges(); } }, // options.resetChanges() to not save the 'config-sets.json' file. Only use in this context.
    outputJSON: { get: function () { return options.outputJSON; }, set: function (val) { options.outputJSON = Boolean(val); options.resetChanges(); } },
    baseFields: { get: function () { return options.baseFields; }, set: function (val) { options.baseFields = (typeof val === 'object' && val !== null) ? val : {}; options.resetChanges(); } },
    outputUri: { get: function () { return options.outputUri; }, set: function (val) { options.outputUri = val + ''; options.resetChanges(); } },
    logDir: { get: function () { return options.logDir; }, set: function (val) { options.logDir = ensureLogDirExists(val + ''); options.resetChanges(); } },
    stdoutFileName: { get: function () { return options.stdoutFileName; }, set: function (val) { options.stdoutFileName = val + ''; options.resetChanges(); } },
    stderrFileName: { get: function () { return options.stderrFileName; }, set: function (val) { options.stderrFileName = val + ''; options.resetChanges(); } },
    exceptionFileName: { get: function () { return options.exceptionFileName; }, set: function (val) { options.exceptionFileName = val + ''; options.resetChanges(); } },
    clearOnStartup: { get: function () { return options.clearOnStartup; }, set: function (val) { options.clearOnStartup = Boolean(val); options.resetChanges(); } },
    saveOnlyUncaughtException: { get: function () { return options.saveOnlyUncaughtException; }, set: function (val) { options.saveOnlyUncaughtException = Boolean(val); options.resetChanges(); } },
    addProcessTag: { get: function () { return options.addProcessTag; }, set: function (val) { options.addProcessTag = Boolean(val); options.resetChanges(); } },
    addFileTag: { get: function () { return options.addFileTag; }, set: function (val) { options.addFileTag = Boolean(val); options.resetChanges(); } },
    silent: { get: function () { return options.silent; }, set: function (val) { options.silent = Boolean(val); options.resetChanges(); } },
    loggingEnabled: { get: function () { return options.loggingEnabled; }, set: function (val) { options.loggingEnabled = Boolean(val); options.resetChanges(); } },
    compressEnabled: { get: function () { return options.compressEnabled; }, set: function (val) { options.compressEnabled = Boolean(val); options.resetChanges(); } },
    // methods
    clearLogFiles: { value: clearLogFiles, writable: false, enumerable: false },
    setOptions: { value: setOptions, writable: false, enumerable: false },
});

module.exports = createLogger;

// Check if the log directory exists, if not create it
ensureLogDirExists(options.logDir);

// Check if the log files exist and remove them
if (options.clearOnStartup) { clearLogFiles(); }

// Redirect uncaught exception to log files
if (!process.listenerCount('uncaughtException', onUncaughtException)) {

    process.on('uncaughtException', onUncaughtException);
}

// Redirect stdout to log file
process.stdout.write = function (chunk, encoding, callback) {

    // If saveOnlyUncaughtException is true, do not log other errors
    if (options.saveOnlyUncaughtException) { return; }

    return logStd.info(chunk, callback);
};

// Redirect stderr to log file
process.stderr.write = function (chunk, encoding, callback) {

    // If saveOnlyUncaughtException is true, do not log other errors
    if (options.saveOnlyUncaughtException) { return; }

    return logStd.warn(chunk, {}, callback);
};

return;


// Uncaught exception listener
function onUncaughtException(err) {

    try {
        createLogger('UncaughtException').
            fatal(err, function () {
                // Exit after logging
                process.exit(1);
            });
    }
    finally {
        // Safety net: still exit if the logger path is gated or fails
        setTimeout(function () { process.exit(1); }, 250).unref();
    }
}
// Clear the log file
function clearLogFiles() {

    if (!options.loggingEnabled) { return; }

    fs.readdir(path.resolve(options.logDir), function (err, files) {

        if (err || !files || !Array.isArray(files)) { return; }

        files.forEach(function (f) {

            [options.stdoutFileName, options.stderrFileName, options.exceptionFileName].forEach(function (logFile) {

                if (f === logFile) { safeUnlink(path.join(path.resolve(options.logDir), f)); }

                if (f.startsWith(logFile.replace(/\.log$/, '-')) && (f.endsWith('.log') || f.endsWith('.log.gz'))) {
                    safeUnlink(path.join(path.resolve(options.logDir), f));
                }
            });
        });
    });

    return;


    function safeUnlink(file) {

        fs.stat(file, { throwIfNoEntry: false }, function (err, stats) {

            if (err || !stats) { return; }

            try { fs.unlinkSync(file); }
            catch (e) { /* ignore */ }
        });
    }
}
// Set multiple options at once
function setOptions(opts) {

    if (typeof opts !== 'object' || opts === null) { return; }

    for (let key in options) {
        if (!(key in opts)) { opts[key] = options[key]; }
    }

    options = opts;

    // Check if the log directory exists, if not create it
    ensureLogDirExists(options.logDir);

    // Check if the log files exist and remove them
    if (options.clearOnStartup) { clearLogFiles(); }

    return options;
}
/**
 * Create a logger for a specific service
 * @param {string} loggerName - The name of the service
 * @param {object} options - Optional settings to override defaults
 * @returns {object} Logger instance with methods: info, debug, warn, error, trace, fatal
 * @property {string} logMode - Log mode (none, short, dev, combined)
 * @property {boolean} outputJSON - Output format (true = JSON, false = text)
 * @property {object} baseFields - Base fields to include in every log entry
 * @property {string} outputUri - Output URI for sending logs via HTTP POST
 * @property {string} logDir - Directory where logs will be saved
 * @property {string} stdoutFileName - File name for standard output logs 
 * @property {string} stderrFileName - File name for standard error logs
 * @property {string} exceptionFileName - File name for uncaught exception logs
 * @property {boolean} clearOnStartup - Clear log files on startup
 * @property {boolean} saveOnlyUncaughtException - Save only uncaught exceptions
 * @property {boolean} addProcessTag - Add process ID to log entries
 * @property {boolean} addFileTag - Add origin file name to log entries
 * @property {boolean} silent - Suppress terminal output
 * @property {boolean} loggingEnabled - Enable or disable logging
 * @property {boolean} compressEnabled - Enable or disable gzip compression for log rotation
 * @method clearLogFiles - Clear the log files immediately
 * @method setOptions - Set multiple options at once
 * @example // Basic usage
 * const logger = createLogger('my-service', { logMode: 'dev', outputJSON: false });
 * logger.info('Service started', { port: 3000 });
 * logger.error('Failed to connect to database', new Error('Connection refused'));
 * logger.trace('HTTP request', { method: 'GET', url: '/api/users' });
 * logger.fatal(new Error('Unrecoverable error occurred'));
 * @example // Load configuration sets (see config-sets.js and config-sets.json)
 * configSets = require("config-sets");
 * const logger = createLogger('my-service', configSets('log-report'));
 * logger.info('Service started', { port: 3000 });
 */
function createLogger(loggerName = '', opts) {

    if (typeof opts === 'object' && opts !== null) { setOptions(opts); }

    const baseFields = (typeof options === 'object' && options !== null && typeof options.baseFields === 'object' && options.baseFields !== null)
        ? options.baseFields : {};

    if (createLogger === this?.constructor) { throw new Error('This function must be used without the `new` keyword.'); }

    loggerName = (loggerName + '').trim();

    return { info, debug, warn, error, trace, fatal };


    /**
     * Log a info message
     * @param {string} message - The message to log e.g. 'User logged in'
     * @param {object} objKV - Optional key-value pairs to include in the log e.g. { userId: 123 }
     * @param {function} callback - Optional callback to execute after logging e.g. function(err) { ... }
     * @returns {void}
     */
    function info(message, objKV = {}, callback) {

        if (options.logMode === 'none') { return; }
        if (typeof objKV === 'function') { callback = objKV; objKV = {}; }
        if (typeof objKV !== 'object' || objKV === null) { objKV = {}; }

        message = (message + '').trim();

        let logObj = { ...baseEcs(loggerName, 'info', message, baseFields), ...kvToLabels(objKV) };
        logObj['event.kind'] = 'event';

        return report(options.stdoutFileName, logObj, callback);
    }
    /**
     * Log a debug message with optional key-value pairs
     * @param {string} message - The message to log
     * @param {object} objKV - Optional key-value pairs to include in the log
     * @param {function} callback - Optional callback to execute after logging
     * @returns {void}
     */
    function debug(message, objKV = {}, callback) {

        if (!options.logMode.includes('dev')
            && !options.logMode.includes('combined')) {
            return;
        }
        if (typeof objKV === 'function') { callback = objKV; objKV = {}; }
        if (typeof objKV !== 'object' || objKV === null) { objKV = {}; }

        message = (message + '').trim();

        let logObj = { ...baseEcs(loggerName, 'debug', message, baseFields), ...kvToLabels(objKV) };
        logObj['event.kind'] = 'event';

        return report(options.stdoutFileName, logObj, callback);
    }
    /**
     * Log a warning message
     * @param {string} message - The warning message to log
     * @param {object} objKV - Optional key-value pairs to include in the log
     * @param {function} callback - Optional callback to execute after logging
     * @returns {void}
     */
    function warn(message, objKV = {}, callback) {

        if (options.logMode === 'none') { return; }
        if (typeof objKV === 'function') { callback = objKV; objKV = {}; }
        if (typeof objKV !== 'object' || objKV === null) { objKV = {}; }

        message = (message + '').trim();

        let logObj = { ...baseEcs(loggerName, 'warn', message, baseFields), ...kvToLabels(objKV) };
        logObj['event.kind'] = 'event';

        return report(options.stderrFileName, logObj, callback);
    }
    /**
     * Log an error message
     * @param {string} message - The error message to log
     * @param {Error|object} errorOrobjKV - Optional Error object or key-value pairs to include in the log
     * @param {function} callback - Optional callback to execute after logging
     * @returns {void}
     */
    function error(message, errorOrobjKV = {}, callback) {

        if (isError(message)) { errorOrobjKV = message; message = errorOrobjKV.message; }
        if (typeof errorOrobjKV === 'function') { callback = errorOrobjKV; errorOrobjKV = {}; }
        if (typeof errorOrobjKV !== 'object' || errorOrobjKV === null) { errorOrobjKV = {}; }

        message = (message + '').trim();

        let logObj = baseEcs(loggerName, 'error', message, baseFields);
        logObj['event.kind'] = 'event';
        logObj['event.outcome'] = 'failure';

        if (isError(errorOrobjKV)) {
            logObj['error.message'] = errorOrobjKV.message;
            logObj['error.stack_trace'] = errorOrobjKV.stack;
            logObj['error.type'] = errorOrobjKV.name;
        } else {
            logObj = { ...logObj, ...kvToLabels(errorOrobjKV) };
        }

        return report(options.stderrFileName, logObj, callback);
    }
    /**
     * Log a trace
     * @param {string} nameOrMessage - The trace message or name
     * @param {any} value - Optional value associated with the trace
     * @param {object} objKV - Optional key-value pairs to include (stored under labels.*)
     * @param {function} callback - Optional callback
     * @returns {void}
     */
    function trace(nameOrMessage, value, objKV = {}, callback) {

        // Gate like debug (trace is verbose)
        if (!options.logMode.includes('dev') && !options.logMode.includes('combined')) { return; }

        if (typeof objKV === 'function') { callback = objKV; objKV = {}; }

        nameOrMessage = (nameOrMessage + '').trim();

        const logObj = baseEcs(loggerName, 'trace', nameOrMessage, baseFields);


        // Map well-known tracing IDs if provided
        if (objKV && typeof objKV === 'object') {
            if (objKV.traceId || objKV['trace.id']) { logObj['trace.id'] = (objKV.traceId || objKV['trace.id']) + ''; delete objKV.traceId; delete objKV['trace.id']; }
            if (objKV.spanId || objKV['span.id']) { logObj['span.id'] = (objKV.spanId || objKV['span.id']) + ''; delete objKV.spanId; delete objKV['span.id']; }
            if (objKV.transactionId || objKV['transaction.id']) { logObj['transaction.id'] = (objKV.transactionId || objKV['transaction.id']) + ''; delete objKV.transactionId; delete objKV['transaction.id']; }
        }

        // ECS base enrichments
        logObj['ecs.version'] = logObj['ecs.version'] || '8.11.0';
        logObj['event.kind'] = logObj['event.kind'] || 'event';
        logObj['event.category'] = logObj['event.category'] || 'process';
        logObj['event.type'] = logObj['event.type'] || 'info';
        logObj['event.action'] = logObj['event.action'] || nameOrMessage;

        // Preserve prior signature by exposing 'event.action' and labels.value only when value supplied
        if (value !== undefined) {
            (logObj.labels ??= {})['value'] = toLabelValue(value);
        }

        // Remaining kv → labels.*
        Object.assign(logObj, kvToLabels(objKV));

        return report(options.stdoutFileName, logObj, callback);
    }
    /**
     * Log a fatal error and exit the process
     * @param {Error|string} error - The fatal error to log
     * @param {object} objKV - Optional key-value pairs to include
     * @param {function} callback - Optional callback to execute after logging
     * @returns {void}
     */
    function fatal(error, objKV = {}, callback) {

        if (!isError(error) && typeof error !== 'string') { error = new Error('Unknown fatal error'); }
        if (!isError(error) && typeof error === 'string') { error = new Error(error + ''); }
        if (typeof objKV === 'function') { callback = objKV; objKV = {}; }
        if (typeof objKV !== 'object' || objKV === null) { objKV = {}; }
        if (!error.message || typeof error.message !== 'string') { error.message = 'Fatal error'; }

        let logObj = { ...baseEcs(loggerName, 'fatal', error.message, baseFields), ...kvToLabels(objKV) };
        logObj['event.kind'] = 'event';
        logObj['event.outcome'] = 'failure';
        logObj['error.message'] = error.message;
        logObj['error.stack_trace'] = error.stack;
        logObj['error.type'] = error.name;

        return report(options.exceptionFileName, logObj, callback);
    }
}
// Report the log entry to the appropriate destination
async function report(fileName, logObj, callback) {

    if (typeof logObj !== 'object' || logObj === null) { return; }

    // Enrich with dataset based on target file (stdout/stderr/exception)
    if (!logObj['event.dataset']) {
        if (fileName === options.stdoutFileName) { logObj['event.dataset'] = 'app.stdout'; }
        else if (fileName === options.stderrFileName) { logObj['event.dataset'] = 'app.stderr'; }
        else if (fileName === options.exceptionFileName) { logObj['event.dataset'] = 'app.exception'; }
        else { logObj['event.dataset'] = 'app.log'; }
    }

    logObj = expandDotNotation(logObj);

    let logStr = options.outputJSON ? JSON.stringify(logObj) : jsonToText(logObj);

    if (options.outputUri) {

        // Send log to the specified URI (e.g. HTTP endpoint)
        let url;

        try { url = new URL(options.outputUri); }
        catch (e) { if (callback) { callback(new Error('Invalid outputUri')); } return; }

        const dataBuf = Buffer.from(JSON.stringify(logObj), 'utf8');

        const req = (url.protocol === 'https:' ? https : http).request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': dataBuf.byteLength }
        }, function (res) { res.resume(); });
        req.on('error', () => { /* optionally: queue, retry or write to stderr file */ });
        req.end(dataBuf);
    }

    if (fileName === options.stdoutFileName) {
        writeToLogFile(fileName, logStr + '\n');

        if (!options.silent) {
            if (options.logMode.includes('dev') && !options.outputJSON) {
                logStr = jsonToText(logObj, true);
            }

            return stdoutWrite(logStr + '\n', 'utf8', callback);
        }

        return;
    }
    else if (fileName === options.stderrFileName) {
        writeToLogFile(fileName, logStr + '\n');

        if (!options.silent) {
            if (options.logMode.includes('dev') && !options.outputJSON) {
                logStr = jsonToText(logObj, true);
            }

            return stderrWrite(logStr + '\n', 'utf8', callback);
        }

        return;
    }

    writeToLogFile(fileName, logStr + '\n', callback);

    if (!options.silent) {
        if (options.logMode.includes('dev') && !options.outputJSON) {
            logStr = jsonToText(logObj, true);
        }

        return stderrWrite(logStr + '\n', 'utf8');
    }
}
// Append to the log file (buffered)
function writeToLogFile(logFile, logData, callback) {

    if (!options.loggingEnabled) { return; }

    const filePath = path.join(path.resolve(options.logDir), logFile);

    const state = getFileState(filePath);
    state.queue.push(logData);

    // Flush immediately if idle (low-latency), also keep a periodic flush every 5s
    if (!state.writing) {
        flushFile(filePath, state);
    }
    scheduleTimer(filePath, state);

    return;


    function getFileState(filePath) {

        let st = fileBuffers.get(filePath);

        if (!st) {
            st = { queue: [], writing: false, timer: null };
            fileBuffers.set(filePath, st);
        }

        return st;
    }
    function scheduleTimer(filePath, state) {

        if (state.timer) { return; }

        state.timer = setTimeout(function () {
            state.timer = null;
            flushFile(filePath, state);
        }, 5007);

        // Prevent this timer from keeping the Node.js process alive
        if (typeof state.timer.unref === 'function') { state.timer.unref(); }
    }
    function flushFile(filePath, state) {

        if (state.writing) { return; }
        if (state.queue.length === 0) { return; }

        state.writing = true;

        // Merge all pending data into one batch
        const batch = state.queue.splice(0, state.queue.length);
        const data = batch.join('');

        // Optional compression (non-blocking, async)
        compressLogFile(filePath, function () {

            fs.appendFile(filePath, data, function (err) {
                if (err) {
                    // If we fail to write, log to stderr directly (bypass logger)
                    stderrWrite(`log-report: Failed to write to log file ${filePath}: ${err.message}\n`, 'utf8');
                }

                state.writing = false;

                // If more data came in while writing, flush immediately again
                if (state.queue.length > 0) {
                    flushFile(filePath, state);
                } else {
                    // Otherwise, ensure a periodic flush exists for future bursts
                    scheduleTimer(filePath, state);
                }
                if (callback) { callback(err); }
            });
        });
    }
    // Compress the log file if it exceeds 1MB (async, can be disabled)
    function compressLogFile(logFilePath, callback) {

        if (!options.compressEnabled) { return callback && callback(); }

        fs.stat(logFilePath, { throwIfNoEntry: false }, function (err, stats) {
            if (err || !stats || stats.size < 1024 * 1024) { return callback && callback(); }

            const gzip = zlib.createGzip(),
                timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, ''),
                archivedLogFilePath = logFilePath.replace(/\.log$/, '-' + timestamp + '.log');

            // Rename the log file to include a timestamp
            fs.rename(logFilePath, archivedLogFilePath, function (renameErr) {

                if (renameErr) { return callback && callback(); }

                // Compress the log file and delete the original
                const inStream = fs.createReadStream(archivedLogFilePath);
                const outStream = fs.createWriteStream(archivedLogFilePath + '.gz');

                inStream
                    .pipe(gzip)
                    .pipe(outStream)
                    .on('error', function (e) { /* swallow compression errors */ })
                    .on('finish', function () {
                        fs.unlink(archivedLogFilePath, function () {
                            callback && callback();
                        });
                    });
            });
        });
    }
}
// Check if the log directory exists, if not create it
function ensureLogDirExists(dir) {

    dir = (dir + '').trim();

    if (!fs.existsSync(path.resolve(dir))) {
        fs.mkdirSync(path.resolve(dir), { recursive: true });
    }

    return dir;
}
// Check if the object is an Error or has 'Error' in its constructor name
function isError(obj) {

    return obj instanceof Error
        || (obj && typeof obj === 'object'
            && obj.constructor && typeof obj.constructor.name === 'string'
            && obj.constructor.name.toUpperCase().includes('ERROR'));
}
// Base ECS fields for all events
function baseEcs(service, level, message, baseFields) {

    level = (level + '').toLowerCase();
    message = (message + '').trim();

    if (!['info', 'debug', 'warn', 'error', 'trace', 'fatal'].includes(level)) { level = 'info'; }
    if (!message) { message = '(no message)'; }

    // https://www.elastic.co/guide/en/ecs/current/ecs-base.html
    const obj = {
        ...baseFields,
        ...{
            '@timestamp': new Date().toISOString(),
            'service.name': service || undefined,
            'log.level': level,
            'message': message
        }
    };
    if (options.addProcessTag) { obj['process.pid'] = process.pid; }
    if (options.addFileTag && process.argv && process.argv[1]) {
        obj['log.origin.file.name'] = path.basename(process.argv[1]);
    }
    // Optionally expose logger name (service) for filtering
    if (service) { obj['log.logger'] = service; }
    return obj;
}
// Expand dot-notation keys into nested objects
function expandDotNotation(obj) {

    if (typeof obj !== 'object' || obj === null) { return {}; }

    const res = {};

    for (let key in obj) {

        let value = obj[key];

        if (key.includes('.')) {

            key.split('.')
                .map(k => k.trim())
                .filter(k => k)
                .reduce((acc, k, idx, arr) => {
                    if (idx === arr.length - 1) { acc[k] = value; }
                    else { acc[k] = acc[k] || {}; }
                    return acc[k];
                }, res);
        }
        else {
            res[key.trim()] = value;
        }
    }

    return res;
}
// Convert extra kv into ECS labels.* (string values)
function kvToLabels(obj) {

    if (typeof obj !== 'object' || obj === null) { return {}; }

    const labels = {};

    for (let key in obj) {
        (labels.labels ??= {})[key] = toLabelValue(obj[key]);
    }

    return labels;
}
// Convert a value to a string suitable for labels
function toLabelValue(val) {

    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (val instanceof Date) return val.toISOString();

    try { return JSON.stringify(val); } catch { return String(val); }
}
// Convert logObj output to text format e.g. [service INFO] message key=value key2=value2
function jsonToText(logObj, colorize) {

    if (typeof logObj !== 'object' || logObj === null) { return ''; }

    const serviceName = logObj.service?.name || logObj['service.name'] || '';
    const level = (logObj.log.level || logObj['log.level'] || '').toUpperCase();
    const time = logObj['@timestamp'];
    const message = logObj.message;

    let res = '[';

    if (colorize) { res += '\x1b[90m'; } // Dark gray
    if (serviceName) { res += `${serviceName} `; }
    if (colorize && level === 'INFO') { res += '\x1b[32m'; } // Green
    if (colorize && level === 'DEBUG') { res += '\x1b[34m'; } // Blue
    if (colorize && level === 'WARN') { res += '\x1b[33m'; } // Yellow
    if (colorize && level === 'ERROR') { res += '\x1b[31m'; } // Red
    if (colorize && level === 'TRACE') { res += '\x1b[35m'; } // Magenta
    if (colorize && level === 'FATAL') { res += '\x1b[41m'; } // Red background
    if (level) { res += level; }
    if (colorize) { res += '\x1b[0m'; } // Reset

    res += '] ';

    if (time) {
        res += `[`;
        if (colorize) { res += '\x1b[36m'; } // Cyan
        res += `${time}`;
        if (colorize) { res += '\x1b[0m'; } // Reset
        res += `] `;
    }
    if (message) {
        if (colorize) { res += '\x1b[1m'; } // Bold
        res += message + ' ';
        if (colorize) { res += '\x1b[0m'; } // Reset
    }

    // Print remaining fields
    const skip = new Set(['service', 'log', 'message', '@timestamp', 'ecs', 'event']);

    for (let key in logObj) {
        if (skip.has(key)) { continue; }
        let value = logObj[key];
        if (typeof value === 'object' && value) {
            // Flatten nested objects into compact string
            try { value = JSON.stringify(value); } catch { value = String(value); }
        }
        if (Array.isArray(value)) { try { value = JSON.stringify(value); } catch { value = String(value); } }
        if (colorize) { res += '\x1b[36m'; } // Cyan
        res += key;
        if (colorize) { res += '\x1b[90m'; } // Dark gray
        res += '=';
        if (colorize) { res += '\x1b[0m'; } // Reset
        res += `${value} `;
    }

    return res.trim();
}
