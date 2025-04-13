
'use strict';

/* longer version */
//const logReport = require('log-report');
//logReport.stdoutFileName = "stdout.log";
//logReport.stderrFileName = "stderr.log";
//logReport.errorFileName = "error.log";
//logReport.save_only_uncaughtException = false;
//logReport.silent = true;
//logReport.clearLogFiles();

/* short version */
require('log-report');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!'); }, 1000);

setTimeout(function () { debugger; }, 2000);