
<div class="row w-100">
<div class="col-lg-3 d-lg-inline">
<div class="sticky-top overflow-auto vh-lg-100">
<div id="list-headers" class="list-group mt-2 ms-lg-2 ms-4">

#### Table of contents
- [**Log Report**](#log-report)
- [**Installation**](#installation)
- [**Basic Usage**](#basic-usage)
- [**Config Sets**](#config-sets)
- [**License**](#license)
    
</div>
</div>
</div>
 
<div class="col-lg-9 mt-2">
<div class="ps-4 markdown-body" data-bs-spy="scroll" data-bs-target="#list-headers" data-bs-offset="0" tabindex="0">

# Log Report
Log Report is a powerful yet simple tool designed to generate comprehensive reports of logs in a directory.  
It helps analyze logs to identify errors, warnings, and other critical information, making it especially useful for applications running in multiple threads.  
The tool is highly customizable, allowing you to tailor reports to your specific needs with ease.

This manual is also available in [HTML5](https://manuel-lohmus.github.io/log-report/README.html).

## Installation
To install the Log Report, you can use the following command:
```bash
npm install log-report
```

## Basic Usage
Short usage example:
```javascript
/* short version */
require('log-report');
// Importing the 'log-report' module will automatically execute it in the current thread, 
// saving the generated information.
```
Longer example:
```javascript
/* longer version */
const logReport = require('log-report');
// Specifies the directory where logs will be saved.
logReport.logDir = "./log/log-report";
// Specify appropriate log file names.
logReport.stdoutFileName = "stdout.log";
logReport.stderrFileName = "stderr.log";
logReport.errorFileName = "error.log";
// This is useful if you want to start with fresh log files, especially during development or testing.
logReport.clearOnStartup = false;
// This is useful if you only want information about Uncaught Exception.
logReport.saveOnlyUncaughtException = false;
// This is useful if you want to get information about the PID of a process, especially during development or testing.
logReport.addProcessTag = false;
// This is useful if you want to get information about the file that started the process, especially during development or testing.
logReport.addFileTag = false;
// Suppresses terminal output when set to true.
logReport.silent = true;
// This is useful if you want to start with fresh log files, especially during development or testing.
logReport.clearLogFiles();
```

## Config Sets
Config sets define the configuration for the log report and are located in the `config-sets.json` file in the root directory of the project.  
They enable dynamic, real-time modification of settings. For example, setting `silent` to `true` suppresses terminal output.  
Refer to the [Config-Sets](https://manuel-lohmus.github.io/config-sets/README.html) section for detailed instructions on defining and using config sets.
```json
{
  "isProduction": true,
  "production": {
    "log_report": {
      "logDir": "./log/log-report",
      "stdoutFileName": "stdout.log",
      "stderrFileName": "stderr.log",
      "errorFileName": "error.log",
      "clearOnStartup": true,
      "saveOnlyUncaughtException": true,
      "addProcessTag": false,
      "addFileTag": false,
      "silent": false,
      "enabled": true
    }
  },
  "development": {}
}
```


## License

This project is licensed under the MIT License.

Copyright &copy; 2025 Manuel Lõhmus



<br>
<br>
<br>
</div>
</div>
</div>