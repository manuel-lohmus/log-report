# log-report: a Node.js Log Report library

[![npm-version](https://badgen.net/npm/v/log-report)](https://www.npmjs.com/package/log-report)
[![npm-week-downloads](https://badgen.net/npm/dw/log-report)](https://www.npmjs.com/package/log-report)

'log-report' is a simple to use. 
Writes 'stdout' and 'stderr' to files: 
*`./log/error.log`
`./log/stderr.log`
`./log/stdout.log`*

## Installing

`npm install log-report`

## Usage example

```js
'use strict';

//process.argv.push('logFileName=myLog_');
var logReport = require('log-report');
//logReport.logRelDir = '/my_log';
logReport.clear();

//require('log-report');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
setTimeout(function () { throw new Error('Throw Error: ...!') }, 100);
```

## License

[MIT](LICENSE)

Copyright (c) 2021 Manuel L&otilde;hmus <manuel@hauss.ee>