#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const userhome = require('userhome');
const LOG_FILE = 'devlog.md';
const HELP_CMD = '-?';
const PRINT_CMD = '-p';
const REVERSE_PRINT_CMD = '-pr';


// Check if there is an existing log or note
module.exports = {
  getLogFile,
  setupLog,
  captureInput,
  addLogEntry,
  printLog,
  printLogReverse,
  showHelp,
};

function getLogFile(optionalDir) {
  return path.join(optionalDir || userhome('devlog'), LOG_FILE);
}


function setupLog(optionalDir) {
  // Try and create a log in the user's home directory if it doesn't already exist
  let logDir = optionalDir || userhome('devlog');
  let logFile = getLogFile(logDir);

  try {
    fs.statSync(logFile);
  } catch (err) {
    // Create directory & file
    try {
      fs.mkdirSync(logDir);   // This could fail if the directory exists, which is fine
    } catch (err2) {}
    fs.writeFileSync(logFile, '');
  }
}

// Async
function captureInput(cb) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });
  let buffer = '';

  console.log('Add log entry: (press Ctrl+C when finished)');

  rl.prompt();

  rl.on('line', (line) => {
    // Save the line somewhere
    buffer += line + '\n';
    rl.prompt();
  }).on('close', () => {
    cb(buffer);
  });
}

// Async
function addLogEntry(newData, cb, optionalDir) {
  let logFile = getLogFile(optionalDir);

  if (!newData.trim()) {
    return cb('\nIgnoring blank log entry.');
  }

  readLogFile(logFile, cb, (logFile, existingData, cb) => {
    let logEntry = '# ' + getLocaleString() + '\n' + newData.trim() + '\n\n';

    if (existingData) {
      logEntry += existingData + '\n';
    }
    fs.writeFile(logFile, logEntry.trim(), (err) => cb(err || `\nLog saved to ${logFile}\nType "devlog ${PRINT_CMD}" to print the log`));
  });
}

// Private
function readLogFile(logFile, doneCB, fileProcessor) {
  fs.readFile(logFile, 'utf8', function(error, existingData) {
    if (error && error.code !== 'ENOENT') {   // Don't worry if the file does not exist, but for all other errors, bail
      doneCB(error);
    } else {
      fileProcessor(logFile, existingData, doneCB);
    }
  });
}

function getLocaleString() {
  let locale = require('os-locale').sync(); // Returns dates with '_' delimited locale fragments.
  const moment = require('moment');

  moment.locale(locale);              // Set the correct locale
  return moment().format('l, LTS');    // http://momentjs.com/docs/#/displaying/format/
}


function printLogReverse(cb, optionalDir) {
  // Display the newest first
  readLogFile(getLogFile(optionalDir), cb, (logFile, existingData, cb) => {
    console.log(existingData);
    cb();
  });
}


function printLog(cb, optionalDir) {
  // Display the oldest first

  readLogFile(getLogFile(optionalDir), cb, (logFile, existingData, cb) => {
    let chunks = existingData.split(/^#/m).reverse();   // Split on all lines starting with '#'
    chunks.pop(); // This is an empty element
    console.log('#' + chunks.join('#'));
    cb();
  });
}


function done(err) {
  if (err) {
    console.info(err);
  }
  process.exit(0);
}


function showHelp() {
  console.log('\nUsage: devlog <options>\n');
  console.log('devlog           Create a log entry');
  console.log(`devlog ${HELP_CMD}        This help information`);
  console.log(`devlog ${PRINT_CMD}        Print the log from oldest-to-newest`);
  console.log(`devlog ${REVERSE_PRINT_CMD}       Print the log from newest-to-oldest\n`);

  console.log(`Log location: ${getLogFile()}`);
}

// If we're not in a test mode, execute the command
if (process.env.NODE_ENV !== 'test') {
  setupLog();

  if (process.argv.indexOf(HELP_CMD) > -1) {
    showHelp();
  } else if (process.argv.indexOf(REVERSE_PRINT_CMD) > -1) {
    printLogReverse(done);
  } else if (process.argv.indexOf(PRINT_CMD) > -1) {
    printLog(done);
  } else {
    captureInput((data) => addLogEntry(data, done));
  }
}
