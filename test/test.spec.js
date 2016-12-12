'use strict';

const devlog = require('../bin/index.js');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

describe('', () => {
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
        // Verify that the log file has not been changed
        assert(fs.readFileSync(logFile).toString().indexOf('New data\nExisting file contents') > -1);
        assert.equal(msg, `\nLog saved to ${logFile}`);
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
  });
});
