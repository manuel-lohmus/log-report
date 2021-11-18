/**Log functions. @preserve Copyright (c) 2020 Manuel Lõhmus.*/
'use strict';

var fs = require('fs');
var path = require('path');

var logRelDir = './log';
exports.logRelDir = logRelDir;
var logName = '';
var argLogName = process.argv.find(function (i) { return i.includes('logFileName'); });
if (argLogName) { logName = argLogName.split('=')[1]; }


function clear() {

    function clearFile(fileName) {

        fs.writeFileSync(logDailyName(fileName), '');
    }

    clearFile('stdout');
    clearFile('stderr');
    clearFile('error');
}
exports.clear = clear;

//#region Log functions

function logDailyName(prefix) {

    var dir = exports.logRelDir;

    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    return path.resolve(dir, logName + prefix + '.log');
}
function writeToLogFile(prefix, originalMsg, isSync = false) {

    const timestamp = new Date().toLocaleString() + '  ';
    const fileName = logDailyName(prefix);

    if (isSync)
        fs.appendFileSync(fileName, timestamp + originalMsg, { flag: 'a+' });
    else
        fs.appendFile(fileName, timestamp + originalMsg, { flag: 'a+' }, function (err) { if (err) { debugger; } });

    return originalMsg;
}

//stdout logging hook
const stdoutWrite0 = process.stdout.write;
process.stdout.write = function (args) {

    writeToLogFile('stdout', args);
    args = Array.isArray(args) ? args : [args];

    return stdoutWrite0.apply(process.stdout, args);
};

//stderr logging hook
const stderrWrite0 = process.stderr.write;
process.stderr.write = function (args) {

    writeToLogFile('stderr', args);
    args = Array.isArray(args) ? args : [args];

    return stderrWrite0.apply(process.stderr, args);
};

//uncaught exceptions
process.on('uncaughtException', function (err) {

    writeToLogFile('error', ((err && err.stack) ? err.stack : err) + '\n', true);
    process.exit(1);
});

//#endregion
