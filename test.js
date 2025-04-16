
'use strict';

/* longer version */
//const logReport = require('log-report');
//// Specifies the directory where logs will be saved.
//logReport.logDir = "./log/log-report";
//// Specify appropriate log file names.
//logReport.stdoutFileName = "stdout.log";
//logReport.stderrFileName = "stderr.log";
//logReport.errorFileName = "error.log";
//// This is useful if you want to start with fresh log files, especially during development or testing.
//logReport.clearOnStartup = false;
//// This is useful if you only want information about Uncaught Exception.
//logReport.saveOnlyUncaughtException = false;
//// This is useful if you want to get information about the PID of a process, especially during development or testing.
//logReport.addProcessTag = false;
//// This is useful if you want to get information about the file that started the process, especially during development or testing.
//logReport.addFileTag = false;
//// Suppresses terminal output when set to true.
//logReport.silent = true;
//// This is useful if you want to start with fresh log files, especially during development or testing.
//logReport.clearLogFiles();

/* short version */
require('log-report');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!'); }, 1000);

setTimeout(function () { debugger; }, 2000);