/**  Copyright (c) 2021, Manuel Lõhmus (MIT License). */

'use strict';

var fs = require("fs"),
    path = require("path"),
    zlib = require("zlib"),
    configSets = require("config-sets"),
    options = configSets('log_report', {
        logDir: "./log/log-report",
        stdoutFileName: "stdout.log",
        stderrFileName: "stderr.log",
        errorFileName: "error.log",
        clearOnStartup: true,
        saveOnlyUncaughtException: true,
        addProcessTag: false,
        addFileTag: false,
        silent: false,
        enabled: true
    }),
    logDir = path.resolve(options.logDir),
    tag = calcTag();


Object.defineProperties(options, {
    clearLogFiles: { value: clearLogFiles, writable: false, enumerable: false }
});

module.exports = options;

// Check if the log directory exists, if not create it
if (!fs.existsSync(logDir)) { fs.mkdirSync(logDir, { recursive: true }); }

// Check if the log files exist and remove them
if (options.clearOnStartup) { clearLogFiles(); }

// Redirect uncaught exception to log files
if (!process.listenerCount("uncaughtException", onUncaughtException)) {

    process.on("uncaughtException", onUncaughtException);
}

// If saveOnlyUncaughtException is true, do not log other errors
if (options.saveOnlyUncaughtException) { return; }

// Redirect stdout to log file
process.stdout.write = (function (write) {

    return function (chunk , encoding, callback) {

        writeToLogFile(options.stdoutFileName, chunk);

        if (options.silent) return true;

        return write.apply(process.stdout, arguments);
    };
})(process.stdout.write);

// Redirect stderr to log file
process.stderr.write = (function (write) {
    
    return function (chunk , encoding, callback) {

        writeToLogFile(options.stderrFileName, chunk);

        if (options.silent) return true;

        return write.apply(process.stderr, arguments);
    };
})(process.stderr.write);

return;


function calcTag() {

    var processTag = '';

    if (options.addProcessTag) {

        processTag = `[pid:${process.pid}`;

        while (processTag.length < 11) { processTag += ' '; }
    }

    if (options.addFileTag) {

        processTag += processTag ? ' ' : '[';

        var fileTag = `${process.argv[1].substring(process.cwd().length + 1)}`;

        if (fileTag.length > 11) { fileTag = fileTag.substring(0, 10) + '~'; }

        while (fileTag.length < 11) { fileTag += ' '; }

        processTag += fileTag;
    }

    if (processTag) { processTag += '] '; }

    return processTag;
}
// Uncaught exception listener
function onUncaughtException(err) {

    writeToLogFile(options.errorFileName, (err.stack || err) + "\n", function () {

        process.exit(1);
    });
}
// Clear the log file
function clearLogFiles() {

    if (!options.enabled) { return; }

    [options.stdoutFileName, options.stderrFileName, options.errorFileName]

        .forEach(function (file) {

            file = path.join(logDir, file);

            if (!fs.existsSync(file)) { return; }

            fs.unlinkSync(file);
        });
}
// Append to the log file
function writeToLogFile(logFile, logData, callback) {

    if (!options.enabled) return;

    logFile = path.join(logDir, logFile)

    // Check if file is larger than 1MB and compress it
    compressLogFile(logFile, function () {

        logData = tag + logData;

        fs.appendFile(logFile, logData, function (err) {

            if (err) { throw err; }

            if (callback) { callback(); }
        });
    });
}
// Compress the log file if it exceeds 1MB
function compressLogFile(logFilePath, callback) {

    var stats = fs.statSync(logFilePath, { throwIfNoEntry: false });

    // Check if the file exists and is larger than 1MB
    if (!stats || stats.size < 1024 * 1024) { return callback(); }

    var gzip = zlib.createGzip(),
        timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, ""),
        archivedLogFilePath = logFilePath.replace(/\.log$/, "-" + timestamp + ".log");

    // Rename the log file to include a timestamp
    fs.renameSync(logFilePath, archivedLogFilePath);

    // Compress the log file and delete the original
    fs.createReadStream(archivedLogFilePath)
        .pipe(gzip)
        .pipe(fs.createWriteStream(archivedLogFilePath + ".gz"))
        .on('error', function (err) { if (err) { throw err; } })
        .on("finish", function () { fs.unlinkSync(archivedLogFilePath); callback(); });
}