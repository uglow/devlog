import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import userhome from 'userhome';
import osLocale from 'os-locale';
import LOGGER from './logger.js';

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
 * @param {object} logger   - where log messages are sent
 * @constructor
 */
export class DevLog {
  constructor(params = {}) {
    const {
      args = [],
      cwd = '',
      logFile = path.join(isLocalLog(args) ? cwd : userhome('devlog'), LOG_FILE),
      logger = LOGGER,
    } = params;
    this.logFile = logFile;
    this.args = args;
    this.logger = logger; // Where we send output
  }

  // This is useful for testing
  setLogger(newLogger) {
    this.logger = newLogger;
  }

  async setupLog() {
    try {
      // Try to read the passed-in logFile
      await fs.stat(this.logFile);
    } catch {
      // this.logger.error(err)
      // Create directory & file
      try {
        await fs.mkdir(path.dirname(this.logFile)); // This could fail if the directory exists, which is fine
      } catch {
        //this.logger.error(err2)
      }
      await fs.writeFile(this.logFile, '');
    }
  }

  async run() {
    await this.setupLog();

    if (this.args.includes(HELP_CMD)) {
      this.showHelp();
    } else if (this.args.includes(LOCAL_MSG_CMD)) {
      // Args will look like this: ['-m', 'foo bar']
      let argIndex = this.args.indexOf(LOCAL_MSG_CMD);
      let data = this.args.length > argIndex + 1 ? this.args[argIndex + 1] : '';
      return this.addLogEntry(data);
    } else if (this.args.includes(PRINT_CMD)) {
      return this.printLog();
    } else if (this.args.includes(REVERSE_PRINT_CMD)) {
      return this.printLogReverse();
    } else {
      return this.captureInput().then((data) => this.addLogEntry(data));
    }
  }

  // Async
  async addLogEntry(newData) {
    if (!newData.trim()) {
      this.logger.info('\nIgnoring blank log entry.');
      return;
    }

    await readLogFile(this.logFile, async (logFile, existingData) => {
      let logEntry = '# ' + getLocaleTimestamp() + '\n' + newData.trim() + '\n\n';

      if (existingData) {
        logEntry += existingData + '\n';
      }
      try {
        await fs.writeFile(logFile, logEntry.trim());
      } catch (err) {
        this.logger.error(err);
      }

      this.logger.info(
        `\nLog saved to ${logFile}\nType "devlog ${PRINT_CMD}${
          isLocalLog(this.args) ? ' ' + LOCAL_CMD : ''
        }" to print the log`,
      );
    });
  }

  async captureInput(options) {
    const streamOptions = options || {
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    };
    const rl = readline.createInterface(streamOptions);
    let buffer = '';

    this.logger.info(`Add log entry to ${this.logFile}: (press Ctrl+C when finished)`);

    return new Promise((resolve) => {
      rl.prompt();

      rl.on('line', (line) => {
        // Save the line somewhere
        buffer += line + '\n';
        rl.prompt();
      }).on('close', () => {
        resolve(buffer);
      });
    });
  }

  async printLog() {
    // Print the oldest entries first
    await readLogFile(this.logFile, (logFile, existingData) => {
      let chunks = existingData.split(/^#/m).reverse(); // Split on all lines starting with '#'
      chunks.pop(); // This is an empty element
      chunks[0] += '\n\n'; // Add space to the end of the last element (which is now the first element)
      this.logger.info('#' + chunks.join('#').trim());
    });
  }

  async printLogReverse() {
    // Display the newest first
    await readLogFile(this.logFile, (logFile, existingData) => {
      this.logger.info(existingData);
    });
  }

  showHelp() {
    this.logger.info('\nUsage: devlog <options>\n');
    this.logger.info('devlog           Create a log entry in the global devlog');
    this.logger.info(`devlog ${HELP_CMD}        This help information`);
    this.logger.info(`devlog ${LOCAL_CMD}        Create a log entry in the local devlog in the current directory`);
    this.logger.info(`devlog ${LOCAL_MSG_CMD} "msg"  Add "msg" to the devlog in the current directory`);
    this.logger.info(`devlog ${PRINT_CMD}        Print the log from oldest-to-newest`);
    this.logger.info(`devlog ${REVERSE_PRINT_CMD}       Print the log from newest-to-oldest\n`);

    this.logger.info(`Global log location: ${this.logFile}`);
  }
}

// Private
async function readLogFile(logFile, fileProcessor) {
  let existingData = '';
  try {
    existingData = await fs.readFile(logFile, 'utf8');
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      // Don't worry if the file does not exist, but for all other errors, bail
      return err;
    }
  }
  return fileProcessor(logFile, existingData);
}

function getLocaleTimestamp() {
  const now = new Date();
  const locale = process.env.CI === 'true' ? undefined : osLocale.sync();
  return now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale);
}

function isLocalLog(args) {
  return args.includes(LOCAL_CMD) || args.includes(LOCAL_MSG_CMD);
}
