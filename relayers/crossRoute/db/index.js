/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const mongoose = require('mongoose');
const ModelOps = require('../db/modelOps');

let crossDbUrl = global.moduleConfig.crossDbUrl;
let dbOption = {
  // autoReconnect: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // reconnectTries: Number.MAX_VALUE,
  // reconnectInterval: 100,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 360000
}
let dbUrl = crossDbUrl + global.argv.agentaddr;

dbUrl = dbUrl + "?authSource=admin";

global.dbUrl = dbUrl;
global.dbOption = dbOption;

let db = mongoose.createConnection(dbUrl, dbOption);
let logger = global.syncLogger ? global.syncLogger : console;

db.on('connected', function(err) {
  if (err) {
    logger.error('Unable to connect to database(' + crossDbUrl.split('/')[3] + global.argv.agentaddr + '):' + err);
    logger.error('Aborting');
    process.exit();
  } else {
    logger.info('Connecting to database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' is successful!');
  }
});

db.on("reconnected", () => {
  logger.warn('Reconnecting to database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr);
});

db.on("error", (err) => {
  logger.error('Connecting to database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' failed!');
  logger.error(err);
  if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
    setTimeout(function () {
      logger.debug("Retrying first connect...");
      db.openUri(dbUrl, dbOption);
    }, 5 * 1000)
  } else {
    logger.error('Connecting to database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + 'Aborting!');
    process.exit(1);
  }
});
db.on("parseError", (err) => {
  logger.error('Connected database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' :ParseError happened');
  logger.error(err);
  logger.error("Aborting!");
  process.exit(1);
});
db.on("disconnected", () => {
  logger.warn('Connected database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' :disconnected happened');
});
db.on("reconnectFailed", (err) => {
  logger.error('Connected database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' :reconnectFailed happened', err);
});
db.on("reconnectTries", () => {
  logger.error('Connected database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + ' :reconnectFailed happened, and no longer attempt to reconnect');
});
db.on("close", () => {
  logger.info('Connected database ' + crossDbUrl.split('/')[3] + global.argv.agentaddr + '::connect:Close happened');
  process.exit(1);
});

let modelOps = new ModelOps(logger, db);

module.exports = modelOps;