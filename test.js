'use strict';

/* longer version */
//var logReport = require('log-report');
//logReport.clear();

/* short version */
//require('log-report');

require('./index.min.js');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!'); }, 100);