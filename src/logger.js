// This wrapper module around loglevel shouldn't be necessary, but Jest
// and LogLevel are not playing nice

export const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4, // This should be the last enum.
};

let logLevel = LOG_LEVEL.ERROR;

export function setLogLevel(level) {
  logLevel = level;
}

const logger = {
  debug(...args) {
    logLevel <= LOG_LEVEL.DEBUG && console.log(...args);
  },
  info(...args) {
    logLevel <= LOG_LEVEL.INFO && console.info(...args);
  },
  warn(...args) {
    logLevel <= LOG_LEVEL.WARN && console.warn(...args);
  },
  error(...args) {
    logLevel <= LOG_LEVEL.ERROR && console.error(...args);
  },
};

export default logger;
