#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const userhome = require('userhome');
const LOG_FILE = 'devlog.md';
const HELP_CMD = '-?';
const LOCAL_CMD = '-l';
const LOCAL_MSG_CMD = '-m';
const PRINT_CMD = '-p';
const REVERSE_PRINT_CMD = '-pr';


/**
 * DevLog - stores the name of the log file that is being used
 * @param {string[]} args   - command line arguments
 * @param {string} cwd      - current working directory (necessary for local devlogs)
 * @param {string} logFile  - full path to the logfile to use
 * @constructor
 */
function DevLog(
  {
    args = [],
    cwd = '',
    logFile = path.join(isLocalLog(args) ? cwd : userhome('devlog'), LOG_FILE),
  }
) {
  this.logFile = logFile;
  this.args = args;
}

function isLocalLog(args) {
  return args.indexOf(LOCAL_CMD) > -1 || args.indexOf(LOCAL_MSG_CMD) > -1;
}


DevLog.prototype.setupLog = function() {
  try {
    fs.statSync(this.logFile);
  } catch (err) {
    // Create directory & file
    try {
      fs.mkdirSync(path.dirname(this.logFile)); // This could fail if the directory exists, which is fine
    } catch (err2) {}
    fs.writeFileSync(this.logFile, '');
  }
};


// Async
DevLog.prototype.captureInput = function(cb) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });
  let buffer = '';

  console.log(`Add log entry to ${this.logFile}: (press Ctrl+C when finished)`);

  rl.prompt();

  rl.on('line', (line) => {
    // Save the line somewhere
    buffer += line + '\n';
    rl.prompt();
  }).on('close', () => {
    cb(buffer);
  });
};


// Async
DevLog.prototype.addLogEntry = function(newData, cb) {
  if (!newData.trim()) {
    return cb('\nIgnoring blank log entry.');
  }

  readLogFile(this.logFile, cb, (logFile, existingData, cb) => {
    let logEntry = '# ' + getLocaleString() + '\n' + newData.trim() + '\n\n';

    if (existingData) {
      logEntry += existingData + '\n';
    }
    fs.writeFile(logFile, logEntry.trim(), (err) => cb(err || `\nLog saved to ${logFile}\nType "devlog ${PRINT_CMD}${isLocalLog(this.args) ? ' ' + LOCAL_CMD : ''}" to print the log`));
  });
};

// Private
function readLogFile(logFile, doneCB, fileProcessor) {
  fs.readFile(logFile, 'utf8', function(error, existingData) {
    if (error && error.code !== 'ENOENT') { // Don't worry if the file does not exist, but for all other errors, bail
      doneCB(error);
    } else {
      fileProcessor(logFile, existingData, doneCB);
    }
  });
}


function getLocaleString() {
  let locale = require('os-locale').sync(); // Returns dates with '_' delimited locale fragments.
  const moment = require('moment');

  moment.locale(locale); // Set the correct locale
  return moment().format('l, LTS'); // http://momentjs.com/docs/#/displaying/format/
}


DevLog.prototype.printLogReverse = function(cb) {
  // Display the newest first
  readLogFile(this.logFile, cb, (logFile, existingData, cb) => {
    console.log(existingData);
    cb();
  });
};


DevLog.prototype.printLog = function(cb) {
  // Display the oldest first

  readLogFile(this.logFile, cb, (logFile, existingData, cb) => {
    let chunks = existingData.split(/^#/m).reverse(); // Split on all lines starting with '#'
    chunks.pop(); // This is an empty element
    chunks[0] += '\n\n'; // Add space to the end of the last element (which is now the first element)
    console.log('#' + chunks.join('#').trim());
    cb();
  });
};

/* istanbul ignore next */
function handleError(err) {
  if (err) {
    console.info(err);
  }
}


DevLog.prototype.showHelp = function() {
  console.log('\nUsage: devlog <options>\n');
  console.log('devlog           Create a log entry in the global devlog');
  console.log(`devlog ${HELP_CMD}        This help information`);
  console.log(`devlog ${LOCAL_CMD}        Create a log entry in the local devlog in the current directory`);
  console.log(`devlog ${LOCAL_MSG_CMD} "msg"  Add "msg" to the devlog in the current directory`);
  console.log(`devlog ${PRINT_CMD}        Print the log from oldest-to-newest`);
  console.log(`devlog ${REVERSE_PRINT_CMD}       Print the log from newest-to-oldest\n`);

  console.log(`Global log location: ${this.logFile}`);
};


DevLog.prototype.run = function() {
  this.setupLog();

  if (this.args.indexOf(HELP_CMD) > -1) {
    this.showHelp();
  } else if (this.args.indexOf(LOCAL_MSG_CMD) > -1) {
    // Args will look like this: ['-m', 'foo bar']
    let argIndex = this.args.indexOf(LOCAL_MSG_CMD);
    let data = (this.args.length > argIndex + 1) ? this.args[argIndex + 1] : '';
    this.addLogEntry(data, handleError);
  } else if (this.args.indexOf(PRINT_CMD) > -1) {
    this.printLog(handleError);
  } else if (this.args.indexOf(REVERSE_PRINT_CMD) > -1) {
    this.printLogReverse(handleError);
  } else {
    this.captureInput((data) => this.addLogEntry(data, handleError));
  }
};


module.exports = DevLog;


// If we're not in a test mode, execute the command
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  const devlog = new DevLog({args: process.argv, cwd: process.cwd()}); // This needs to be somewhere else so we can test it
  devlog.run();
}
