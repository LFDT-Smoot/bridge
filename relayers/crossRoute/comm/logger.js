/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const winston = require("winston");
require('winston-daily-rotate-file');
const moment = require('moment');
const util = require('util');
const MESSAGE = Symbol.for('message');
const SPLAT = Symbol.for('splat');
const path = require('path');

/**
 * logger support 4 level
 * @info
 * @debug 
 * @warn 
 * @error 
 */

class Logger {
  constructor(name, file, errorFile, level = 'info') {
    this.name = name;
    this.file = file;
    this.errorFile = errorFile;
    this.level = level;
    if (global.pkg) {
      this.filePath = path.join(process.cwd(),file);
      this.errorFilePath = path.join(process.cwd(),errorFile);
    } else {
      this.filePath = file;
      this.errorFilePath = errorFile;
    }

    this.init(this.name, this.file, this.errorFile, this.level);
  }

  init(name, file, errorFile, level) {
    this.logger = winston.createLogger({
      levels: winston.config.syslog.levels,
      level: level,
      format: winston.format(function(info, opts) {
        let prefix = util.format('%s %s %s %s', "agent" + global.argv.agentaddr, moment.utc().format('YYYY-MM-DD HH:mm:ss,SSS').trim(), name, info.level.toUpperCase());
        if (info[SPLAT]) {
          info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message, ...info[SPLAT]));
        } else {
          info[MESSAGE] = util.format('%s %s', prefix, util.format(info.message));
        }
        return info;
      })(),
      transports: [
        new winston.transports.Console({
          handleExceptions: true
        }),
        new(winston.transports.DailyRotateFile)({
          filename: this.filePath,
          level: level,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
          maxFiles: '10d'
        })
      ],
      exitOnError: false
    });
  }

  debug(...params) {
    try {
      this.logger.debug(...params);
    } catch(err) {
      this.error(err);
    }
  }

  info(...params) {
    try {
      this.logger.info(...params);
    } catch(err) {
      this.error(err);
    }
  }

  warn(...params) {
    try {
      this.logger.warning(...params);
    } catch(err) {
      this.error(err);
    }
  }

  error(...params) {
    try {
      this.logger.error(...params);
    } catch(err) {
      console.log(err);
    }
  }
}

module.exports = Logger;