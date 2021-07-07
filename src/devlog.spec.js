import { DevLog } from './devLog.js';
import { jest } from '@jest/globals';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import userhome from 'userhome';
import { fileURLToPath } from 'url';

describe('DevLog', () => {
  describe('constructor()', () => {
    it('should set the logFile to the users home directory by default', () => {
      let devlog = new DevLog({});

      expect(devlog.logFile).toEqual(path.join(userhome('devlog'), 'devlog.md'));
    });

    it('should set the logFile to the current working directory if specified in the arguments', () => {
      let devlog = new DevLog({ args: ['-l'], cwd: '/foo/bar' });

      expect(devlog.logFile).toEqual(path.join('/foo/bar', 'devlog.md'));
    });
  });

  describe('file operations', () => {
    let tmpDir;
    let logFile;
    let devlog;

    beforeEach(() => {
      tmpDir = path.join(process.cwd(), 'tmpDir-' + Date.now());
      logFile = path.join(tmpDir, 'devlog.md');
      devlog = new DevLog({ logFile });
    });

    afterEach(() => {
      try {
        fs.unlinkSync(logFile);

        fs.rmdirSync(tmpDir);
      } catch {}
      assert.throws(() => fs.statSync(tmpDir), /no such file or directory/, 'directory should be removed');
    });

    describe('setupLog()', () => {
      it('should create a log if one does not exist', async () => {
        await devlog.setupLog();
        expect(fs.statSync(logFile)).toEqual(expect.any(Object)); // Log file has been created
      });

      it('should not create a new log if one already exists', async () => {
        const CONTENT = 'Existing file contents';
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, CONTENT);

        await devlog.setupLog();

        // Verify that the log file has not been changed
        expect(fs.readFileSync(logFile).toString()).toEqual(CONTENT);
      });
    });

    describe('addLogEntry()', () => {
      describe('to existing log', () => {
        beforeEach(() => {
          fs.mkdirSync(tmpDir);
          fs.writeFileSync(logFile, 'Existing file contents');
        });

        it('should append the log data to the top of the file', async () => {
          const mockLogger = { info: jest.fn() };
          devlog.setLogger(mockLogger);

          await devlog.addLogEntry('New data');

          expect(fs.readFileSync(logFile).toString().includes('New data\n\nExisting file contents')).toEqual(true);
          expect(mockLogger.info).toHaveBeenCalledWith(`\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
        });

        it('should detect when the log is local and display appropriate message after adding content', async () => {
          const mockLogger = { info: jest.fn() };
          devlog = new DevLog({ logFile, args: ['-l'], logger: mockLogger });
          await devlog.addLogEntry('New data');
          expect(fs.readFileSync(logFile).toString().includes('New data\n\nExisting file contents')).toEqual(true);
          expect(mockLogger.info).toHaveBeenCalledWith(
            `\nLog saved to ${logFile}\nType "devlog -p -l" to print the log`,
          );
        });

        it('should ignore blank entries', async () => {
          const mockLogger = { info: jest.fn() };
          devlog.setLogger(mockLogger);

          await devlog.addLogEntry('   \n  ');

          // Verify that the log file has not been changed
          expect(fs.readFileSync(logFile).toString()).toEqual('Existing file contents');
          expect(mockLogger.info).toHaveBeenCalledWith('\nIgnoring blank log entry.');
        });

        it('should trim whitespace from the ends of the log entry', async () => {
          const mockLogger = { info: jest.fn() };
          devlog.setLogger(mockLogger);

          await devlog.addLogEntry('\n\n   foo\n   \n  ');

          expect(fs.readFileSync(logFile).toString().includes('foo\n\nExisting file contents')).toEqual(true);
          expect(mockLogger.info).toHaveBeenCalledWith(`\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
        });
      });

      it('should not fail when the log file does not exist, but will create the file', async () => {
        const mockLogger = { info: jest.fn() };
        devlog.setLogger(mockLogger);

        fs.mkdirSync(tmpDir); // This deletes the log file that was there
        expect(() => fs.statSync(logFile)).toThrow('no such file or directory');

        await devlog.addLogEntry('New data');

        // Verify that the log file has not been changed
        expect(fs.readFileSync(logFile).toString().includes('New data')).toEqual(true);
        expect(mockLogger.info).toHaveBeenCalledWith(`\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
      });
    });
  });

  describe('captureInput()', () => {
    let devlog = new DevLog({ logFile: 'logFile (not used)' });

    it('should call a callback function when the input terminates with a single line of text', async () => {
      const MOCK_DATA = ['a single line'];
      const streamOptions = {
        input: Readable.from(MOCK_DATA.join('\n')),
        output: process.stdout,
        prompt: '> ',
      };

      const capturedData = await devlog.captureInput(streamOptions);
      expect(capturedData).toEqual(MOCK_DATA + '\n');
    });

    it('should call a callback function when the input terminates with multiple lines of text', async () => {
      const MOCK_DATA = ['line1', 'line2'];
      const streamOptions = {
        input: Readable.from(MOCK_DATA.join('\n')),
        output: process.stdout,
        prompt: '> ',
      };

      const capturedData = await devlog.captureInput(streamOptions);
      expect(capturedData).toEqual(MOCK_DATA.join('\n') + '\n');
    });

    it('should call a callback function when the input terminates with no text', async () => {
      const streamOptions = {
        input: Readable.from([]),
        output: process.stdout,
        prompt: '> ',
      };

      const capturedData = await devlog.captureInput(streamOptions);
      expect(capturedData).toEqual('');
    });
  });

  describe('printLog()', () => {
    it('should display the log from oldest to newest', async () => {
      // Use this instead of __dirname:
      const LOG_FILE = fileURLToPath(new URL('../test/fixtures/devlog.md', import.meta.url));
      const mockLogger = { info: jest.fn() };
      const devlog = new DevLog({ logFile: LOG_FILE, logger: mockLogger });

      await devlog.printLog();

      const infoCalls = mockLogger.info.mock.calls[0][0];
      expect(infoCalls.indexOf('Log entry 3') < infoCalls.indexOf('Log entry 1')).toEqual(true);
    });
  });

  describe('printLogReverse()', () => {
    it('should display the log from newest to oldest', async () => {
      // Use this instead of __dirname:
      const LOG_FILE = fileURLToPath(new URL('../test/fixtures/devlog.md', import.meta.url));
      const mockLogger = { info: jest.fn() };
      const devlog = new DevLog({ logFile: LOG_FILE, logger: mockLogger });

      await devlog.printLogReverse();

      const infoCalls = mockLogger.info.mock.calls[0][0];
      expect(infoCalls.indexOf('Log entry 3') > infoCalls.indexOf('Log entry 1')).toEqual(true);
    });
  });

  describe('showHelp()', () => {
    it('should display some help message', () => {
      const mockLogger = { info: jest.fn() };
      const devlog = new DevLog({ logFile: '/foo/bar', logger: mockLogger });

      devlog.showHelp();

      expect(mockLogger.info).toHaveBeenNthCalledWith(1, '\nUsage: devlog <options>\n');
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'devlog           Create a log entry in the global devlog');
      expect(mockLogger.info).toHaveBeenNthCalledWith(3, 'devlog -?        This help information');
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        4,
        'devlog -l        Create a log entry in the local devlog in the current directory',
      );
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        5,
        'devlog -m "msg"  Add "msg" to the devlog in the current directory',
      );
      expect(mockLogger.info).toHaveBeenNthCalledWith(6, 'devlog -p        Print the log from oldest-to-newest');
      expect(mockLogger.info).toHaveBeenNthCalledWith(7, 'devlog -pr       Print the log from newest-to-oldest\n');
      expect(mockLogger.info).toHaveBeenNthCalledWith(8, 'Global log location: /foo/bar');
    });
  });

  describe('run()', () => {
    function setupComponent(params = {}) {
      const { args = [], inputData = '' } = params;
      // Mock all the methods on this class
      const devlog = new DevLog({ args, cwd: '/local/path' });
      devlog.setupLog = jest.fn().mockResolvedValue();
      devlog.printLog = jest.fn().mockResolvedValue();
      devlog.printLogReverse = jest.fn().mockResolvedValue();
      devlog.captureInput = jest.fn().mockResolvedValue(inputData);
      devlog.addLogEntry = jest.fn().mockResolvedValue();
      devlog.showHelp = jest.fn();

      return devlog;
    }

    it('should call setupLog() and captureInput() when there are no arguments', async () => {
      const log = setupComponent();
      await log.run();
      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(0);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenNthCalledWith(1);
      expect(log.addLogEntry).toHaveBeenNthCalledWith(1, '');
      expect(log.logFile).toEqual(path.join(userhome('devlog') + '/devlog.md'));
    });

    it('should call setupLog() and showHelp() when -? is passed', async () => {
      const log = setupComponent({ args: ['-?', '-other args do not matter', '-p'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(1);
      expect(log.printLog).toHaveBeenCalledTimes(0);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenCalledTimes(0);
      expect(log.logFile).toEqual(path.join(userhome('devlog') + '/devlog.md'));
    });

    it('should call setupLog() and addLogEntry() when -m is passed with a message, and the logfile should be local', async () => {
      const log = setupComponent({ args: ['-m', 'my message', '-other args are processed first', '-p'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(0);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenNthCalledWith(1, 'my message');
      expect(log.logFile).toEqual('/local/path/devlog.md');
    });

    it('should call setupLog() and addLogEntry() when -m is passed without a message', async () => {
      const log = setupComponent({ args: ['-m'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(0);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenNthCalledWith(1, '');
      expect(log.logFile).toEqual('/local/path/devlog.md');
    });

    it('should call setupLog() and printLog() when -p is passed', async () => {
      const log = setupComponent({ args: ['-p', '-other args do not matter', '-pr'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(1);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenCalledTimes(0);
      expect(log.logFile).toEqual(path.join(userhome('devlog') + '/devlog.md'));
    });

    it('should call setupLog() and printLog() when -p and -l is passed', async () => {
      const log = setupComponent({ args: ['-p', '-l'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(1);
      expect(log.printLogReverse).toHaveBeenCalledTimes(0);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenCalledTimes(0);
      expect(log.logFile).toEqual('/local/path/devlog.md');
    });

    it('should call setupLog() and printLogReverse() when -pr is passed', async () => {
      const log = setupComponent({ args: ['-pr', '-other args are processed first'] });
      await log.run();

      expect(log.setupLog).toHaveBeenCalledTimes(1);
      expect(log.showHelp).toHaveBeenCalledTimes(0);
      expect(log.printLog).toHaveBeenCalledTimes(0);
      expect(log.printLogReverse).toHaveBeenCalledTimes(1);
      expect(log.captureInput).toHaveBeenCalledTimes(0);
      expect(log.addLogEntry).toHaveBeenCalledTimes(0);
      expect(log.logFile).toEqual(path.join(userhome('devlog') + '/devlog.md'));
    });
  });
});
