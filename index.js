/**Log functions. @preserve Copyright (c) 2021 Manuel Lõhmus.*/
"use strict";

var options = require("config-sets").init({
    log_report: {
        logDir: "./log/log-report",
        clear_on_startup: true,
        save_only_uncaughtException: true,
        enabled: true
    }
}).log_report;

var zlib = require("zlib");
var fs = require("fs");
var path = require("path");
var logDir = path.resolve(options.logDir);
var filenames = ["stdout", "stderr", "error"];

var counter = 100;
function checkSize() {

    if (counter > 0) { counter--; return; }
    counter = 100;

    var filesSize = filenames
        .map(function (filename) {

            var pathName = path.resolve(logDir, logDailyName(filename));

            if (fs.existsSync(pathName))
                return fs.statSync(pathName).size;
            else
                return 0;
        })
        .reduce(function (accumulator, size) { return accumulator + size; }, 0);

    if (filesSize > 262144) {

        var sDate = new Date().toISOString().replace("T", " ").replace("Z", "").replaceAll(":", " ").split(".")[0];

        filenames.forEach(function (filename) {

            var oldPath = logDailyName(filename);
            var newPath = logDailyName(sDate + " " + filename);

            if (!fs.existsSync(oldPath)) return;

            fs.renameSync(oldPath, newPath);

            var fileContents = fs.createReadStream(newPath, { flag: "r+" });
            var writeStream = fs.createWriteStream(newPath + ".gz", { flag: "w+" });
            var zip = zlib.createGzip();
            fileContents.pipe(zip).pipe(writeStream).on("finish", function () {
                fs.unlink(newPath, function (err) { if (err) { console.error(err); } });
            });
        });
    }
}
function logDailyName(prefix) { return path.resolve(logDir, prefix + ".log"); }
function writeToLogFile(prefix, originalMsg, isSync = false) {

    if (options.enabled) {

        checkSize();

        const timestamp = new Date().toISOString() + "  ";
        const fileName = logDailyName(prefix);

        if (isSync)
            try {
                fs.appendFileSync(fileName, timestamp + originalMsg, { flag: "a+" });
            } catch (err) { console.error(err); }
        else
            fs.appendFile(fileName, timestamp + originalMsg, { flag: "a+" }, function (err) { if (err) { console.error(err); } });
    }
    return originalMsg;
}
function clear() {

    if (options.enabled) {
        filenames.forEach(function (fileName) {
            if (fs.existsSync(logDailyName(fileName)))
                fs.writeFileSync(logDailyName(fileName), "");
        });
    }
}
exports.clear = clear;

if (options.clear_on_startup) { clear(); }



//#region Log functions

if (!fs.existsSync(logDir)) { fs.mkdirSync(logDir, { recursive: true }); }

//stdout logging hook
const stdoutWrite0 = process.stdout.write;
process.stdout.write = function (args) {

    if (!options.save_only_uncaughtException) {
        writeToLogFile("stdout", args);
    }
    args = Array.isArray(args) ? args : [args];

    return stdoutWrite0.apply(process.stdout, args);
};

//stderr logging hook
const stderrWrite0 = process.stderr.write;
process.stderr.write = function (args) {

    if (!options.save_only_uncaughtException) {
        writeToLogFile("stderr", args);
    }
    args = Array.isArray(args) ? args : [args];

    return stderrWrite0.apply(process.stderr, args);
};

//uncaught exceptions
process.on("uncaughtException", function (err) {

    writeToLogFile("error", ((err && err.stack) ? err.stack : err) + "\n", true);
    process.exit(1);
});

//#endregion