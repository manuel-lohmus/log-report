'use strict';

//process.argv.push('logFileName=myLog_');
var logReport = require('./index.js');
//logReport.logRelDir = '/my_log';
logReport.clear();

//require('./index.js');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!') }, 100);