<div class="row w-100">
<div class="col-lg-3 d-inline">
<div class="sticky-top overflow-auto vh-lg-100">
<div id="list-headers" class="list-group mt-3">

#### &ensp;&ensp;&ensp;Table of contents
- [**Log Report**](#log-report)
- [**Config Sets**](#config-sets)
- [**Installation**](#installation)
- [**Basic Usage**](#basic-usage)
- [**License**](#license)
    
</div>
</div>
</div>
 
<div class="col-lg-9 mt-2">
<div class="ps-4 markdown-body" data-bs-spy="scroll" data-bs-target="#list-headers" data-bs-offset="0" tabindex="0">

# Log Report
Log Report is a simple tool to generate a report of the logs in a directory. 
It can be used to analyze the logs and find errors, warnings, and other important information.
This is useful if the app runs in multiple threads.
It is designed to be easy to use and customizable, allowing you to tailor the report to your needs.

This manual is also available in [HTML5](https://manuel-lohmus.github.io/log-report/README.html).

## Config Sets
The config-sets are used to define the configuration for the log report.
The configuration sets are defined in the `config-sets.json` file located in the root directory of the project.
Config-sets allow you to modify settings dynamically in real time.  
For instance, by setting `silent` to `true`, no terminal output will be displayed.
See the [Config-Sets](https://manuel-lohmus.github.io/config-sets/README.html) section for more information on how to define the config sets.

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
logReport.stdoutFileName = "stdout.log";
logReport.stderrFileName = "stderr.log";
logReport.errorFileName = "error.log";
logReport.save_only_uncaughtException = false;
logReport.silent = true;
logReport.clearLogFiles();
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