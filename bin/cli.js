#!/usr/bin/env node
import { DevLog } from '../src/devLog.js';
import { setLogLevel, LOG_LEVEL } from '../src/logger.js';

setLogLevel(LOG_LEVEL.INFO);
const devLog = new DevLog({ args: process.argv, cwd: process.cwd() });
devLog.run();
