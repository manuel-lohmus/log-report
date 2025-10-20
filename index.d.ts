// Type definitions for log-report
// Project: https://github.com/manuel-lohmus/log-report
// Definitions by: ChatGPT

/// <reference types="node" />

declare type LogMode = 'none' | 'short' | 'dev' | 'combined';

declare interface LogCallback {
  (err?: Error | null): void;
}

declare interface KeyValues {
  [key: string]: any;
}

declare interface Logger {
  /**
   * Log an info message.
   */
  info(message: string, objKV?: KeyValues | LogCallback, callback?: LogCallback): void;

  /**
   * Log a debug message (visible when logMode includes 'dev' or 'combined').
   */
  debug(message: string, objKV?: KeyValues | LogCallback, callback?: LogCallback): void;

  /**
   * Log a warning message.
   */
  warn(message: string, objKV?: KeyValues | LogCallback, callback?: LogCallback): void;

  /**
   * Log an error.
   * Accepts either message + Error/object or an Error directly.
   */
  error(messageOrError: string | Error, errorOrObjKV?: Error | KeyValues | LogCallback, callback?: LogCallback): void;

  /**
   * Log a trace entry (verbose; gated by 'dev' or 'combined').
   * nameOrMessage is recorded as message; value (if present) goes to labels.value.
   * objKV maps to labels.*; well-known ids are promoted to ECS ids:
   *   trace.id | traceId, span.id | spanId, transaction.id | transactionId
   */
  trace(nameOrMessage: string, value?: any, objKV?: KeyValues | LogCallback, callback?: LogCallback): void;

  /**
   * Log a fatal error (intended for terminal failures).
   */
  fatal(error: Error | string, objKV?: KeyValues | LogCallback, callback?: LogCallback): void;
}

declare interface Settings {
  /**
   * Log mode. Default: 'short'
   * 'none' | 'short' | 'dev' | 'combined'
   */
  logMode: LogMode;

  /**
   * Output format. Default: true (true = JSON, false = text)
   */
  outputJSON: boolean;

  /**
   * Optional HTTP(S) endpoint URI for POSTing logs, e.g. "http://localhost:3000/logs".
   * When present, logs are also sent to this endpoint.
   */
  outputUri: string;

  /**
   * Directory for log files. Default: "./logs/log-report"
   */
  logDir: string;

  /**
   * File name for stdout-level logs. Default: "stdout.log"
   */
  stdoutFileName: string;

  /**
   * File name for stderr-level logs. Default: "stderr.log"
   */
  stderrFileName: string;

  /**
   * File name for fatal/exception logs. Default: "exception.log"
   */
  exceptionFileName: string;

  /**
   * Remove existing log files at startup. Default: true
   */
  clearOnStartup: boolean;

  /**
   * If true, only UncaughtException is recorded; stdout/stderr hooks are not attached. Default: true
   */
  saveOnlyUncaughtException: boolean;

  /**
   * Include process.pid in events. Default: false
   */
  addProcessTag: boolean;

  /**
   * Include the starter script file name (log.origin.file.name). Default: false
   */
  addFileTag: boolean;

  /**
   * Suppress console output. Default: false
   */
  silent: boolean;

  /**
   * Toggle file logging. Default: true
   */
  loggingEnabled: boolean;

  /**
   * Enable gzip rotation over ~1MB per file. Default: true
   */
  compressEnabled: boolean;
}

/**
 * Create a logger bound to a service name.
 * Returned logger emits ECS-like events to files (stdout/stderr/exception),
 * optionally to console, and optionally via HTTP(S) if outputUri is set.
 */
declare function createLogger(service?: string): Logger;

declare namespace createLogger {
  // Settings (getters/setters)
  let logMode: Settings['logMode'];
  let outputJSON: Settings['outputJSON'];
  let outputUri: Settings['outputUri'];
  let logDir: Settings['logDir'];
  let stdoutFileName: Settings['stdoutFileName'];
  let stderrFileName: Settings['stderrFileName'];
  let exceptionFileName: Settings['exceptionFileName'];
  let clearOnStartup: Settings['clearOnStartup'];
  let saveOnlyUncaughtException: Settings['saveOnlyUncaughtException'];
  let addProcessTag: Settings['addProcessTag'];
  let addFileTag: Settings['addFileTag'];
  let silent: Settings['silent'];
  let loggingEnabled: Settings['loggingEnabled'];
  let compressEnabled: Settings['compressEnabled'];

  /**
   * Deletes existing log files (stdout/stderr/exception) in the current logDir.
   */
  function clearLogFiles(): void;
}

export = createLogger;