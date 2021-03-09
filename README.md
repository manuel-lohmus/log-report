# log-report: a Node.js Log Report library

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

//require('log-report');

console.log('Log test.');
console.warn('Warn test');
console.error('Error test.');
throw new Error('Throw Error: ...!');
```

## License

[MIT](LICENSE)

Copyright (c) 2021 Manuel L&otilde;hmus <manuel@hauss.ee>