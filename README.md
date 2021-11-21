# log-report: a Node.js Log Report library

[![npm-version](https://badgen.net/npm/v/log-report)](https://www.npmjs.com/package/log-report)
[![npm-week-downloads](https://badgen.net/npm/dw/log-report)](https://www.npmjs.com/package/log-report)

'log-report' is a simple to use. 
Writes 'stdout' and 'stderr' to files: 
*`error.log`
`stderr.log`
`stdout.log`*

## Installing

`npm install log-report`

## Usage example
app.js
```js
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
```

## Config-sets file
config-sets.json [*Read more...*](https://github.com/manuel-lohmus/config-sets)
```json
{
  "production": {
    "isDebug": false,
    "log_report": {
      "logDir": "./log/log-report",
      "enabled": true,
      "save_only_uncaughtException": true,
      "clear_on_startup": false
    }
  },
  "development": {
    "isDebug": true,
    "log_report": {
      "enabled": true,
      "save_only_uncaughtException": false,
      "clear_on_startup": true
    }
  }
}
```

## License

[MIT](LICENSE)

Copyright (c) 2021 Manuel L&otilde;hmus <manuel@hauss.ee>