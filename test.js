'use strict';

//process.argv.push('logFileName=myLog_');
//var logReport = require('./index.js');
//logReport.logRelDir = '/my_log';

require('./index.js');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
throw new Error('Throw Error: ...!');