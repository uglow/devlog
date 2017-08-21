'use strict';

let DevLog = require('../bin/index.js');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const userhome = require('userhome');

describe('DevLog', () => {
  describe('constructor()', () => {
    it('should set the logFile to the users home directory by default', () => {
      let devlog = new DevLog({});

      assert.equal(devlog.logFile, path.join(userhome('devlog'), 'devlog.md'));
    });

    it('should set the logFile to the current working directory if specified in the arguments', () => {
      let devlog = new DevLog({args: ['-l'], cwd: '/foo/bar'});

      assert.equal(devlog.logFile, path.join('/foo/bar', 'devlog.md'));
    });
  });

  describe('file operations', () => {
    let tmpDir;
    let logFile;
    let devlog;

    beforeEach(() => {
      tmpDir = path.join(process.cwd(), 'tmpDir-' + (new Date()).getTime());
      logFile = path.join(tmpDir, 'devlog.md');
      devlog = new DevLog({logFile});
    });

    afterEach(() => {
      fs.unlinkSync(logFile);
      fs.rmdirSync(tmpDir);
      assert.throws(() => fs.statSync(tmpDir), /no such file or directory/, 'directory should be removed');
    });


    describe('setupLog()', () => {
      it('should create a log if one does not exist', () => {
        devlog.setupLog();
        assert(fs.statSync(logFile)); // Log file has been created
      });


      it('should not create a new log if one already exists', () => {
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, 'Existing file contents');

        devlog.setupLog();

        // Verify that the log file has not been changed
        assert.equal(fs.readFileSync(logFile), 'Existing file contents');
      });
    });


    describe('addLogEntry()', () => {
      describe('to existing log', () => {
        beforeEach(() => {
          fs.mkdirSync(tmpDir);
          fs.writeFileSync(logFile, 'Existing file contents');
        });

        it('should append the log data to the top of the file', (done) => {
          devlog.addLogEntry('New data', (msg) => {
            assert(fs.readFileSync(logFile).toString().indexOf('New data\n\nExisting file contents') > -1);
            assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
            done();
          });
        });

        it('should detect when the log is local and display appropriate message after adding content', (done) => {
          devlog = new DevLog({logFile, args: ['-l']});
          devlog.addLogEntry('New data', (msg) => {
            assert(fs.readFileSync(logFile).toString().indexOf('New data\n\nExisting file contents') > -1);
            assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p -l" to print the log`);
            done();
          });
        });

        it('should ignore blank entries', (done) => {
          devlog.addLogEntry('   \n  ', (msg) => {
            // Verify that the log file has not been changed
            assert(fs.readFileSync(logFile).toString() === 'Existing file contents');
            assert.equal(msg, '\nIgnoring blank log entry.');
            done();
          });
        });

        it('should trim whitespace from the ends of the log entry', (done) => {
           devlog.addLogEntry('\n\n   foo\n   \n  ', (msg) => {
            assert(fs.readFileSync(logFile).toString().indexOf('foo\n\nExisting file contents') > -1);
            assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
            done();
          });
        });
      });

      it('should not fail when the log file does not exist, but will create the file', (done) => {
        fs.mkdirSync(tmpDir);
        // The log file does not exist, but it will afterwards

        devlog.addLogEntry('New data', (msg) => {
          // Verify that the log file has not been changed
          assert(fs.readFileSync(logFile).toString().indexOf('New data') > -1);
          assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
          done();
        });
      });
    });
  });


  describe('captureInput()', () => {
    let devlog = new DevLog({logFile: 'logFile (not used)'});

    it('should call a callback function when the input terminates with a single line of text', () => {
      let stdin = require('mock-stdin').stdin();
      const MOCK_DATA = 'a single line';
      let capturedData;
      let cb = (data) => capturedData = data;

      devlog.captureInput(cb);
      stdin.send(MOCK_DATA);
      stdin.end();

      assert.equal(capturedData, MOCK_DATA + '\n');
    });

    it('should call a callback function when the input terminates with multiple lines of text', () => {
      let stdin = require('mock-stdin').stdin();
      const MOCK_DATA = ['line1', 'line2'];
      let capturedData;
      let cb = (data) => capturedData = data;

      devlog.captureInput(cb);
      stdin.send(MOCK_DATA);
      stdin.end();

      assert.equal(capturedData, MOCK_DATA.join('\n') + '\n');
    });

    it('should call a callback function when the input terminates with no text', () => {
      let stdin = require('mock-stdin').stdin();
      let capturedData;
      let cb = (data) => capturedData = data;

      devlog.captureInput(cb);
      stdin.end();

      assert.equal(capturedData, '');
    });
  });

  const PRINT_LOG_FIXTURE = __dirname + '/fixtures/devlog.md';

  describe('printLog()', () => {
    it('should display the log from oldest to newest', (done) => {
      const stdout = require('test-console').stdout;
      let inspect = stdout.inspect();
      let devlog = new DevLog({logFile: PRINT_LOG_FIXTURE});

      devlog.printLog(() => {
        inspect.restore(); // Stop capturing stdout

        assert(inspect.output[0].indexOf('Log entry 3') < inspect.output[0].indexOf('Log entry 1'));
        done();
      });
    });
  });


  describe('printLogReverse()', () => {
    it('should display the log from newest to oldest', (done) => {
      const stdout = require('test-console').stdout;
      let inspect = stdout.inspect();
      let devlog = new DevLog({logFile: PRINT_LOG_FIXTURE});

      devlog.printLogReverse(() => {
        inspect.restore(); // Stop capturing stdout

        console.log(inspect.output);
        assert(inspect.output[0].indexOf('Log entry 1') < inspect.output[0].indexOf('Log entry 3'));
        done();
      });
    });
  });


  describe('showHelp()', () => {
    it('should display some help message', () => {
      const stdout = require('test-console').stdout;
      let devlog = new DevLog({logFile: '/foo/bar'});

      let output = stdout.inspectSync(() => {
        devlog.showHelp();
      });

      assert.equal(output[0], '\nUsage: devlog <options>\n\n');
      assert.equal(output[1], 'devlog           Create a log entry in the global devlog\n');
      assert.equal(output[2], 'devlog -?        This help information\n');
      assert.equal(output[3], 'devlog -l        Create a log entry in the local devlog in the current directory\n');
      assert.equal(output[4], 'devlog -m "msg"  Add "msg" to the devlog in the current directory\n');
      assert.equal(output[5], 'devlog -p        Print the log from oldest-to-newest\n');
      assert.equal(output[6], 'devlog -pr       Print the log from newest-to-oldest\n\n');
      assert.equal(output[7], 'Global log location: /foo/bar\n');
    });
  });


  describe('run()', () => {
    let setupLogCalled;
    let captureInputCalled;
    let addLogEntryData;
    let showHelpCalled;
    let printLogCalled;
    let printLogReverseCalled;

    function runDevLog(args = []) {
      setupLogCalled = false;
      printLogCalled = false;
      printLogReverseCalled = false;
      captureInputCalled = false;
      addLogEntryData = '';
      showHelpCalled = false;

      let devlog = new DevLog({args, cwd: '/local/path'});
      devlog.setupLog = () => setupLogCalled = true;
      devlog.printLog = () => printLogCalled = true;
      devlog.printLogReverse = () => printLogReverseCalled = true;
      devlog.captureInput = () => captureInputCalled = true;
      devlog.addLogEntry = (data) => addLogEntryData = data;
      devlog.showHelp = () => showHelpCalled = true;
      devlog.run();

      return devlog;
    }

    it('should call setupLog() and captureInput() when there are no arguments', () => {
      let log = runDevLog();
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, false);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, true);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, path.join(userhome('devlog') + '/devlog.md'));
    });

    it('should call setupLog() and showHelp() when -? is passed', () => {
      let log = runDevLog(['-?', '-other args do not matter', '-p']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, true);
      assert.equal(printLogCalled, false);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, path.join(userhome('devlog') + '/devlog.md'));
    });


    it('should call setupLog() and addLogEntry() when -m is passed with a message, and the logfile should be local', () => {
      let log = runDevLog(['-m', 'my message', '-other args are processed first', '-p']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, false);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, 'my message');
      assert.equal(log.logFile, '/local/path/devlog.md');
    });


    it('should call setupLog() and addLogEntry() when -m is passed without a message', () => {
      let log = runDevLog(['-m']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, false);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, '/local/path/devlog.md');
    });


    it('should call setupLog() and printLog() when -p is passed', () => {
      let log = runDevLog(['-p', '-other args do not matter', '-pr']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, true);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, path.join(userhome('devlog') + '/devlog.md'));
    });


    it('should call setupLog() and printLog() when -p and -l is passed', () => {
      let log = runDevLog(['-p', '-l']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, true);
      assert.equal(printLogReverseCalled, false);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, '/local/path/devlog.md');
    });


    it('should call setupLog() and printLogReverse() when -pr is passed', () => {
      let log = runDevLog(['-pr', '-other args are processed first']);
      assert.equal(setupLogCalled, true);
      assert.equal(showHelpCalled, false);
      assert.equal(printLogCalled, false);
      assert.equal(printLogReverseCalled, true);
      assert.equal(captureInputCalled, false);
      assert.equal(addLogEntryData, '');
      assert.equal(log.logFile, path.join(userhome('devlog') + '/devlog.md'));
    });
  });
});


