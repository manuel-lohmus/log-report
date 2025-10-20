<p>
  <img src="logo/logo-512x256.png" alt="log-report logo" width="440" style="background-color:darkolivegreen;border-radius:1em;">
</p>

# log-report

Lightweight Node.js logging with ECS-style fields, file rotation, 
optional HTTP output, and zero-dependency runtime API.

## 📚 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🗺️ Output formats](#️output-formats)
- [🧮 Tracing helpers](#-tracing-helpers)
- [🔃 HTTP output](#-http-output)
- [🗜️ Log rotation and compression](#️-log-rotation-and-compression)
- [❌ Exceptions](#-exceptions)
- [📄 TypeScript](#-typescript)
- [📚 Examples](#-examples)
- [🧪 Tests](#-tests)
- [📜 License - MIT](#-license)

---

## ✨ Features

- Zero dependencies, pure Node.js
- ECS-style fields (`@timestamp`, `log.level`, `message`, `service.name`, etc.)
- JSON or text output (colorized in `dev` mode)
- Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Log modes: `none`, `short`, `dev`, `combined`
- File targets: stdout, stderr, exception
- Safe uncaughtException handler
- Optional HTTP(S) POST per log (`outputUri`)
- Use with `config-sets` for config management (recommended)
- or direct options or runtime getters/setters
- Buffered appends + gzip rotation over ~1MB (configurable)

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 📦 Installation

[Available on npm](https://www.npmjs.com/package/log-report)

```bash
npm install log-report
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🚀 Quick start

1) Load the module (installs handlers based on settings)
```js
const createLogger = require('log-report');
```

2) Create a service logger
```js
const log = createLogger('app');
```

3) Emit logs
```js
log.info('Application started', { env: process.env.NODE_ENV });
log.debug('Cache primed', { entries: 42 });
log.warn('Disk space low', { percentFree: 7 });
log.error(new Error('Something went wrong'));
log.trace('db.query', { sql: 'SELECT 1' });        // visible in 'dev' or 'combined'
log.fatal('Cannot continue', { code: 'E_FATAL' }); // also goes to exception log
```

4) (Optional) Clear log files on startup
```js 
createLogger.clearLogFiles();
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## ⚙️ Configuration

Possibilitys:
1) Create a logger instance with options:

```js
const createLogger = require('log-report');
const log = createLogger('payments', {
    logMode: 'dev',                         // includes dev-style logs so trace is visible
    outputJSON: false,                      // human-readable text mode
    baseFields: {
        'ECS.version': '1.12.0',            // ECS version
        service: { name: 'payment-service' }// ECS service.name
    },
    saveOnlyUncaughtException: false,       // enable stdout/stderr hooks
    logDir: './logs/log-report',
    clearOnStartup: true,                   // start clean
    addProcessTag: true,                    // adds process.pid
    addFileTag: true,                       // adds log.origin.file.name
    silent: false                           // also print to console
});
// Example logs
log.info('Payment service started');
log.trace('db.query', { sql: 'SELECT * FROM orders' });
log.error(new Error('Database connection failed'));
log.fatal('Cannot continue', { code: 'E_FATAL' });
log.trace('user.login', { userId: 12345, traceId: 'abcde12345' }); // trace helper
log.trace('cache.miss', 'Cache miss for user 12345', { key: 'user_12345' }); // with value
```

2) Use default settings and modify as needed:

```js
const createLogger = require('log-report');
const log = createLogger('app'); // uses default settings
log.info('App started');
```

3) Settings are runtime getters/setters on the exported function:

```js
const logReport = require('log-report');
// Modes: 'none' | 'short' | 'dev' | 'combined' 
logReport.logMode = 'dev';
logReport.outputJSON = true;                  // JSON vs text 
logReport.outputUri = 'http://localhost:5985/log-report'; // optional HTTP endpoint 
logReport.logDir = './logs/log-report';
logReport.stdoutFileName = 'stdout.log'; 
logReport.stderrFileName = 'stderr.log'; 
logReport.exceptionFileName = 'exception.log';
logReport.clearOnStartup = true; 
logReport.saveOnlyUncaughtException = false;  // if true, stdout/stderr hooks are not attached 
logReport.addProcessTag = true; 
logReport.addFileTag = true; 
logReport.silent = false;                     // print to console 
logReport.loggingEnabled = true;              // file logging on/off 
logReport.compressEnabled = true;             // gzip rotation over ~1MB
// Utility 
logReport.clearLogFiles();
```

4) Loggers can also be created with `config-sets` (recommended):

Install `config-sets`:
```bash
npm install config-sets
```

Then use in your app:
```js
const configSets = require('config-sets');
const createLogger = require('log-report');
const log = createLogger('orders', configSets(`module:log-report`));
// Example logs
log.info('Order service started');
log.trace('db.query', { sql: 'SELECT * FROM orders' });
log.error(new Error('Database connection failed'));
log.fatal('Cannot continue', { code: 'E_FATAL' });
log.trace('user.login', { userId: 12345, traceId: 'abcde12345' }); // trace helper
log.trace('cache.miss', 'Cache miss for user 12345', { key: 'user_12345' }); // with value
```

Tip: values also integrate with `config-sets` (config-sets.json) under the `log-report` key.

Example config-sets.json:
```json
/* Configuration settings for application. */
{
  /* Set to true to use production settings, */
  /* false for development settings. Default is true. */
  "isProduction": true,
  /* Settings used in production mode. */
  /* These settings are saved to "config-sets.json" file. */
  "production": {
    /* 'module:log-report' settings */
    /* These settings configure the logging behavior of the application. */
    /* Changes are applied in real time when new settings are saved to file. */
    "module:log-report": {
      /* Log mode. Default: 'short' */
      /* Example values: 'none', 'short', 'dev', 'combined' */
      /* 'none' = disable all logging except uncaughtException to exception.log */
      /* 'short' = info, warn, error, fatal to respective files (stdout.log, stderr.log, exception.log) */
      /* 'dev' = like 'short' but also includes debug and trace to stdout.log (for development) */
      /* 'combined' = like 'dev' but also includes http info (if provided in log.trace) to stdout (logs all) */
      /* 'dev' and 'combined' are verbose and may include sensitive information, use with caution in production. */
      "logMode": "short",
      /* Output format. Default: true (true = JSON format, false = text format) */
      /* If false, the output format will be a human-readable text format. */
      /* This is useful for development or debugging, but not recommended for production. */
      "outputJSON": true,
      "baseFields": {},
      /* Output URI. Default: '' (e.g. 'http://localhost:3000/logs') */
      /* If set, logs will be sent to the specified URI via HTTP POST in JSON format. */
      /* Ensure that the URI is reachable and can accept POST requests with JSON payloads. */
      /* If empty, logs will only be written to log files. */
      "outputUri": "",
      /* Specifies the directory where logs will be saved. Default: './logs/log-report' */
      /* Ensure that the directory exists or the application has permission to create it. */
      /* Relative paths are resolved against the current working directory. */
      /* Absolute paths are used as-is. (e.g. '/var/log/myapp') */
      "logDir": "./logs/log-report",
      /* Specify appropriate log file names. Default: 'stdout.log' */
      "stdoutFileName": "stdout.log",
      /* Specify appropriate log file names. Default: 'stderr.log' */
      "stderrFileName": "stderr.log",
      /* Specify appropriate log file names. Default: 'exception.log' */
      "exceptionFileName": "exception.log",
      /* This is useful if you want to start with fresh log files, */
      /* especially during development or testing. Default: true */
      "clearOnStartup": true,
      /* This is useful if you only want information about Uncaught Exception. Default: false */
      "saveOnlyUncaughtException": true,
      /* This is useful if you want to get information about the PID of a process, */
      /* especially during development or testing. Default: false */
      /* Note: In clustered environments, multiple processes may write to the same log file. */
      /* Consider using 'addFileTag' for better traceability. */
      "addProcessTag": false,
      /* This is useful if you want to get information about the file that started the process, */
      /* especially during development or testing. Default: false */
      /* Note: In clustered environments, multiple processes may write to the same log file. */
      /* This adds the 'log.origin.file.name' field to each log entry. */
      "addFileTag": false,
      /* Suppresses terminal output when set to true. Default: false */
      /* When false, log messages will be printed to the console in addition to being saved to log files. */
      /* When true, log messages will only be saved to log files. */
      "silent": false,
      /* Enable or disable logging. Default: true */
      /* When false, no logs will be written to files, but uncaught exceptions will still be handled. */
      /* This can be useful for temporarily disabling logging without changing other settings. */
      "loggingEnabled": true,
      /* Enable or disable gzip rotation over 1MB. Default: true */
      /* When true, log files exceeding 1MB will be compressed using gzip to save disk space. */
      /* When false, log files will grow indefinitely unless manually managed. */
      "compressEnabled": true
    }
  },
  /* Settings used in development mode. */
  /* These settings are not saved to file and are created from production settings. */
  /* You can override these settings using command line arguments. */
  /* Set only the settings you want to change. */
  "development": {
    "module:log-report": {
      "logMode": "dev",
      "outputJSON": false,
      "clearOnStartup": true,
      "saveOnlyUncaughtException": false,
      "addProcessTag": true,
      "addFileTag": true,
      "silent": false,
      "loggingEnabled": true,
      "compressEnabled": false
    }
  }
}
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🗺️Output formats

Two formats are supported:
- JSON (default): single-line ECS-style objects suitable for ingestion.
- Text: human readable. In `dev` mode, text is colorized and includes key=value pairs.

Example JSON (abbreviated):
```json
{ "@timestamp": "2025-01-01T12:00:00.000Z", "service.name": "app", "log.logger": "app", "log.level": "info", "message": "Application started", "event.kind": "event", "event.dataset": "app.stdout", "labels": { "env": "production" } }
```
Example text (abbreviated):
```bash
[2025-01-01T12:00:00.000Z] [info] Application started env=production
[2025-01-01T12:00:01.000Z] [debug] Cache primed entries=42
[2025-01-01T12:00:02.000Z] [warn] Disk space low percentFree=7
[2025-01-01T12:00:03.000Z] [error] Something went wrong Error: Something went wrong
    at Object.<anonymous> (/path/to/file.js:10:15)
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    ...
[2025-01-01T12:00:04.000Z] [trace] db.query sql=SELECT 1
[2025-01-01T12:00:05.000Z] [fatal] Cannot continue code=E_FATAL
[2025-01-01T12:00:06.000Z] [trace] user.login trace.id=abcde12345 userId=12345
[2025-01-01T12:00:07.000Z] [trace] cache.miss Cache miss for user 12345 key=user_12345
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🧮 Tracing helpers

The
`trace()` promotes common IDs to ECS fields:
- `trace.id` from `objKV.traceId` or `objKV['trace.id']`
- `span.id` from `objKV.spanId` or `objKV['span.id']`
- `transaction.id` from `objKV.transactionId` or `objKV['transaction.id']`

Remaining key/values are placed under `labels.*`. If a `value` argument is provided, it appears as `labels.value`.
Example:
```js
log.trace('user.login', { userId: 12345, traceId: 'abcde12345' }); // traceId becomes trace.id
log.trace('cache.miss', { key: 'user_12345' }, 'Cache miss for user 12345'); // with value
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🔃 HTTP output

If `outputUri` is set, logs are sent as JSON via HTTP POST. File and console outputs still apply unless disabled.

When `outputUri` is set, each log is POSTed to the endpoint as JSON. File and console outputs still apply unless disabled.

Example HTTP payload:
```json
{ "@timestamp": "2025-01-01T12:00:00.000Z", "service.name": "app", "log.logger": "app", "log.level": "info", "message": "Application started", "event.kind": "event", "event.dataset": "app.stdout", "labels": { "env": "production" } }
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🗜️ Log rotation and compression

Logs are buffered and flushed every second or when the buffer exceeds 1KB. When a log file exceeds ~1MB, it is rotated and compressed with gzip (if `compressEnabled` is `true`).

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## ❌ Exceptions

Uncaught exceptions are logged to `exception.log` and the process exits. If `saveOnlyUncaughtException` is `true`, only uncaught exceptions are recorded (stdout/stderr hooks are not attached).

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 📄 TypeScript

Type definitions are included. If using TypeScript, import as below. Ensure your `tsconfig.json` has `"esModuleInterop": true` or use `import * as createLogger from 'log-report'` if not.

`index.d.ts` is included.
```ts
import createLogger from 'log-report';
const log = createLogger('api');
log.info('ready');
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 📚 Examples

See `examples/`:
- `basic-ecs-json.js`: JSON output
- `dev-trace-text.js`: dev mode with trace and text output
- `http-output.js`: send logs to HTTP endpoint
- `rotate-compress.js`: file rotation and gzip

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 🧪 Tests

Project includes tests using [test-runner-lite](https://www.npmjs.com/package/test-runner-lite). No additional setup is needed.
Use test-runner-lite (or Node directly) to run tests.

Run all tests:

```bash
npm test
```

Run the test directly:

```bash
node ./index.test.js
```

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---

## 📜 License

This project is licensed under the MIT License.<br>
Copyright &copy; Manuel Lõhmus

<p align="right"><a href="#log-report">Back to top ↑</a></p>

---