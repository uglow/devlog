#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const userhome = require('userhome');
const LOG_FILE = 'devlog.md';

// Check if there is an existing log or note
module.exports = {
  setupLog,
  captureInput,
  addLogEntry,
};


function setupLog(optionalDir) {
  // Try and create a log in the user's home directory if it doesn't already exist
  let logDir = optionalDir || userhome('devlog');
  let logFile = path.join(logDir, LOG_FILE);

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
  let logFile = path.join(optionalDir || userhome('devlog'), LOG_FILE);

  if (!newData.trim()) {
    return cb('\nIgnoring blank log entry.');
  }

  fs.readFile(logFile, 'utf8', function(error, existingData) {
    if (error && error.code !== 'ENOENT') {
      cb(error);
    } else {
      let logEntry = '# ' + (new Date()).toLocaleString() + '\n' + newData + '\n';
      if (existingData) {
        logEntry += existingData + '\n';
      }
      fs.writeFile(logFile, logEntry, (err) => cb(err || `\nLog saved to ${logFile}`));
    }
  });
}

function done(err) {
  if (err) {
    console.info(err);
  }
  process.exit(0);
}

// If we're not in a test mode, execute the command
if (process.env.NODE_ENV !== 'test') {
  setupLog();
  captureInput((data) => addLogEntry(data, done));
}
