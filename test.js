'use strict';

//require('log-report').clear();
var logReport = require('./index.min.js');
logReport.clear();

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!'); }, 100);