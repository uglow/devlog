'use strict';

const devlog = require('../bin/index.js');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

describe('devlog', () => {
  describe('file operations', () => {
    let tmpDir;
    let logFile;

    beforeEach(() => {
      tmpDir = path.join(process.cwd(), 'tmpDir-' + (new Date()).getTime());
      logFile = path.join(tmpDir, 'devlog.md');
    });

    afterEach(() => {
      fs.unlinkSync(logFile);
      fs.rmdirSync(tmpDir);
      assert.throws(() => fs.statSync(tmpDir), /no such file or directory/, 'directory should be removed');
    });


    describe('setupLog()', () => {
      it('should create a log if one does not exist', () => {
        devlog.setupLog(tmpDir);
        assert(fs.statSync(logFile));      // Log file has been created
      });


      it('should not create a new log if one already exists', () => {
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, 'Existing file contents');

        devlog.setupLog(tmpDir);

        // Verify that the log file has not been changed
        assert.equal(fs.readFileSync(logFile), 'Existing file contents');
      });
    });


    describe('addLogEntry()', () => {
      it('should append the log data to the top of the file', (done) => {
        let logFile = path.join(tmpDir, 'devlog.md');
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, 'Existing file contents');

        devlog.addLogEntry('New data', (msg) => {
          assert(fs.readFileSync(logFile).toString().indexOf('New data\n\nExisting file contents') > -1);
          assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
          done();
        }, tmpDir);
      });

      it('should ignore blank entries', (done) => {
        let logFile = path.join(tmpDir, 'devlog.md');
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, 'Existing file contents');

        devlog.addLogEntry('   \n  ', (msg) => {
          // Verify that the log file has not been changed
          assert(fs.readFileSync(logFile).toString() === 'Existing file contents');
          assert.equal(msg, '\nIgnoring blank log entry.');
          done();
        }, tmpDir);
      });


      it('should trim whitespace from the ends of the log entry', (done) => {
        let logFile = path.join(tmpDir, 'devlog.md');
        fs.mkdirSync(tmpDir);
        fs.writeFileSync(logFile, 'Existing file contents');

        devlog.addLogEntry('\n\n   foo\n   \n  ', (msg) => {
          assert(fs.readFileSync(logFile).toString().indexOf('foo\n\nExisting file contents') > -1);
          assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
          done();
        }, tmpDir);
      });


      it('should not fail when the log file does not exist, but will create the file', (done) => {
        fs.mkdirSync(tmpDir);
        // The log file does not exist, but it will afterwards

        devlog.addLogEntry('New data', (msg) => {
          // Verify that the log file has not been changed
          assert(fs.readFileSync(logFile).toString().indexOf('New data') > -1);
          assert.equal(msg, `\nLog saved to ${logFile}\nType "devlog -p" to print the log`);
          done();
        }, tmpDir);
      });
    });
  });


  describe('captureInput()', () => {
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


  describe('printLog()', () => {
    it('should display the log from oldest to newest', (done) => {
      const stdout = require('test-console').stdout;
      let inspect = stdout.inspect();

      devlog.printLog(() => {
        inspect.restore();    // Stop capturing stdout

        assert(inspect.output[0].indexOf('Log entry 3') < inspect.output[0].indexOf('Log entry 1'));
        done();
      }, __dirname + '/fixtures/');
    });
  });


  describe('printLogReverse()', () => {
    it('should display the log from newest to oldest', (done) => {
      const stdout = require('test-console').stdout;
      let inspect = stdout.inspect();

      devlog.printLogReverse(() => {
        inspect.restore();    // Stop capturing stdout

        console.log(inspect.output);
        assert(inspect.output[0].indexOf('Log entry 1') < inspect.output[0].indexOf('Log entry 3'));
        done();
      }, __dirname + '/fixtures/');
    });
  });


  describe('showHelp()', () => {
    it('should display some help message', () => {
      const stdout = require('test-console').stdout;

      let output = stdout.inspectSync(() => {
        devlog.showHelp();
      });

      assert.equal(output[0], '\nUsage: devlog <options>\n\n');
      assert.equal(output[1], 'devlog           Create a log entry\n');
      // etc...
    });
  });
});
