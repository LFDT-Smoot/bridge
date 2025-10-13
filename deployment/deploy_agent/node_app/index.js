/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

require('module-alias/register')

const optimist = require('optimist')

console.log("Command line arguments:");
console.log(process.argv.slice(2));

let argv = optimist
  .usage("Usage: $0 -i [index] \
  --agentaddr [agentaddr] \
  --dbip [dbIp] --dbport [dbPort] --dbuser [dbUser] \
  [--testnet] [--leader] \
  --loglevel [loglevel] --pkg [pkg]\
  --password [password] --keystore [keystore] \
  ")
  .alias({ 'h': 'help', 'i': 'index' })
  .describe({
    'dbip': 'identify db ip',
    'dbport': 'identify db port',
    'dbuser': 'identify db user',
    'testnet': 'identify whether using testnet or not, if no "--testnet", using mainnet as default',
    'leader': 'identify whether is leader agent, only leader will send the cross transaction',
    'pkg': 'identify whether to start with pkg env',
    'password': 'identify password path(file)',
    'keystore': 'identify keystore path(dir)'
  })
  .boolean(['testnet', 'leader', 'pkg'])
  .string(['agentaddr', 'dbip', 'dbuser', 'loglevel', 'password', 'keystore'])
  .default({ 'loglevel': 'debug', 'pkg': true })
  .demand(['agentaddr'])
  .check(function (argv) {
    return true;
  })
  .argv;

if (argv.help) {
  optimist.showHelp();
}

argv.agentaddr = argv.agentaddr.toLowerCase();
global.argv = argv;
global.testnet = argv.testnet ? true : false;
global.dbIp = argv.dbip;
global.dbPort = argv.dbport;
global.pkg = argv.pkg ? true : false;
global.isLeader = argv.leader ? true : false;

global.agentAddr = argv.agentaddr;
global.keystore = global.argv.keystore;

const fs = require('fs');
try {
  global.keystore = global.argv.keystore;
  if (global.argv.password) {
    global.secret = JSON.parse(fs.readFileSync(global.argv.password));
  }
} catch (err) {
  console.log(err);
  // process.exit(0);
}

const Logger = require('./framework/comm/logger.js');
global.syncLogger = new Logger("agent-sync", "log/agent.log", "log/agentSync_error.log", global.argv.loglevel);
global.monitorLogger = new Logger("agent-action", "log/agent.log", "log/agentMonitor_error.log", global.argv.loglevel);
global.multisigLogger = new Logger("agent-multisig", "log/agent.log", "log/agentMultisig_error.log", global.argv.loglevel);

const {
  hexTrip0x,
  loadConfig,
  sleep
} = require('./framework/comm/lib');


global.moduleConfig = require('./framework/config/moduleConfig.js');

global.modelOps = require('./framework/storage');
// global.agentDict = require('./agent').agentDict;
// let { getAgentByChain } = require('./agent');

let { syncChain } = require('@framework/chainSync.js');
let { monitorHandler } = require('./framework/monitor')

require('./framework/context/initialize');

const context = require('./framework/context');

async function initTokenList() {
  try {
    global.config = loadConfig();
    let tempTokenList = {};

    tempTokenList.apiURL = process.env.apiUrl ? process.env.apiUrl : `https://${global.config.apiIp}:${global.config.apiPort}`;
    global.apiURL = tempTokenList.apiURL;

    tempTokenList.crossScAddr = [];
    tempTokenList.supportChains = [];

    for (let chainType of Object.keys(global.config.crossTokens)) {
      tempTokenList.supportChains.push(chainType);
      tempTokenList[chainType] = {};


      if (global.moduleConfig.crossInfoDict[chainType].CONTRACT && global.moduleConfig.crossInfoDict[chainType].CONTRACT.gatewayAddr) {
        tempTokenList[chainType].crossScAddr = global.moduleConfig.crossInfoDict[chainType].CONTRACT.gatewayAddr;
        tempTokenList.crossScAddr.push(tempTokenList[chainType].crossScAddr);
      }
    }

    global.syncLogger.info("CrossRoute agent initTokenList: ", JSON.stringify(tempTokenList, null, 4));
    global.syncLogger.debug("CrossRoute agent initTokenList supportChains: ", tempTokenList.supportChains);
    global.syncLogger.info("CrossRoute agent initTokenList done!");

    return tempTokenList;
  } catch (err) {
    global.syncLogger.error("initTokenList error ", err);

    throw new Error('InitTokenList error');
  }
}

async function syncMain(logger) {
  logger.info("********************************** syncMain start **********************************");

  try {
    for (let chainType of global.tokenList.supportChains) {
      logger.info("********************************** syncMain begin subSyncMain ********************************** chainType is", chainType);

      subSyncMain(chainType, logger);
    }
  } catch (err) {
    logger.error("syncMain failed:", err);
  }
}

async function subSyncMain(chainType, logger) {
  let sync_interval_time = (global.moduleConfig.crossInfoDict[chainType]
    && global.moduleConfig.crossInfoDict[chainType].CONF
    && global.moduleConfig.crossInfoDict[chainType].CONF.SYNC_INTERVAL_TIME)
    ? global.moduleConfig.crossInfoDict[chainType].CONF.SYNC_INTERVAL_TIME
    : global.moduleConfig.SYNC_INTERVAL_TIME;

  while (1) {
    try {
      logger.info("********************************** subSyncMain start **********************************",
        "global.tokenList.supportChains.length ", global.tokenList.supportChains.length,
        "chainType is", chainType, "sync_interval_time is", sync_interval_time);

      await syncChain(chainType, logger);
      await sleep(sync_interval_time);
    } catch (err) {
      logger.error("subSyncMain syncChain failed at chain :", chainType, err);
      await sleep(sync_interval_time);
    }
  }
}

async function handlerMain(logger) {
  while (1) {
    try {
      logger.info("********************************** handlerMain start **********************************");

      if (!global.isLeader && global.moduleConfig.multiSignature) {
        for (let chainType of global.tokenList.supportChains) {
          await syncRelayRequest(logger, chainType);//, hexTrip0x(global.tokenList[chainType].pk));
        }
      } else {
        monitorHandler(logger);
      }
    } catch (err) {
      logger.error("handlerMain failed:", err);
    }

    await sleep(global.moduleConfig.INTERVAL_TIME);
  }
}

async function syncRelayRequest(logger, chainType) {
  try {
    let multiSig = context.getRelay(chainType);

    let multiSigApproveDatas = [];
    multiSigApproveDatas = await multiSig.getForApprove(chainType);

    logger.info("********************************** syncRelayRequest start ********************************** get multiSigApproveDatas length", multiSigApproveDatas.length);

    let multiDataApproves = [...multiSigApproveDatas].map((approveData) => {
      return new Promise(async (resolve, reject) => {
        try {
          let option = { hashX: approveData.uniqueId };
          let recordInDb = await global.modelOps.getEventHistory(option);
          if (recordInDb.length === 0) {
            resolve();
            return;
          }
          let transOnChain = approveData.chainType;
          let crossAgent = context.getAgent(transOnChain, recordInDb[0]);

          let checkResult = await crossAgent.checkRelayData(approveData);
          if (checkResult) {
            const extData = {chainType: transOnChain, encodedInfo: approveData.rawData };
            const multiSignatureResult = await multiSig.approve(approveData.uniqueId, approveData.dataHash, extData);

            logger.info("********************************** syncRelayRequest get one valid data ********************************** for hashX :", recordInDb, transOnChain, JSON.stringify(approveData, null, 4), "multiSignatureResult: ", multiSignatureResult);
          } else {
            logger.warn("********************************** syncRelayRequest get one invalid data ********************************** for hashX :", recordInDb, transOnChain, JSON.stringify(approveData, null, 4));
          }
          resolve();
        } catch (err) {
          logger.error("syncRelayRequest failed", JSON.stringify(approveData.hashData, null, 0), "hashData", " Error: ", err, " multiSigTx: ", approveData);
          resolve();
        }
      });
    });

    try {
      if (multiSigApproveDatas !== null && multiSigApproveDatas.length !== 0) {
        await Promise.all(multiDataApproves);
      }
      logger.info("********************************** syncRelayRequest done **********************************");
    } catch (err) {
      logger.error("syncRelayRequest failed", err);
      return await Promise.reject(err);
    }
  } catch (err) {
    logger.error("syncRelayRequest failed:", err);
  }
}

async function main() {
  try {
    global.currVersion = '1.0.0';
    if (global.pkg) {
      global.syncLogger.info("CrossRoute agent version %s start with process.cwd!", global.currVersion, process.cwd());
    }
    global.syncLogger.info("CrossRoute agent start!", global.argv);

    global.chainBlock = {};

    global.agentRestart = true;

    while (!global.modelOps || (global.modelOps.db && global.modelOps.db.readyState !== global.modelOps.db.states.connected)) {
      global.syncLogger.warn("wait for CrossRoute agent db connected");
      await sleep(10 * 1000);
    }

    global.tokenList = await initTokenList();

    global.syncLogger.info('use global.apiURL', global.apiURL);

    syncMain(global.syncLogger);

    handlerMain(global.monitorLogger);
  } catch (err) {
    global.syncLogger.error("main start failed", err);
    process.exit(0);
  }
}

function exceptionHandler(error) {
  // Will print "uncaughtException err is not defined"
  global.syncLogger.error('main file uncaughtException', error.message || error);
}

function rejectionHandler(error) {
  // Will print "unhandledRejection err is not defined"
  global.syncLogger.error('unhandledRejection', error.message || error);
}

process.on('uncaughtException', exceptionHandler);
process.on('unhandledRejection', rejectionHandler);

main();

exports.initTokenList = initTokenList;
exports.syncMain = syncMain;
exports.subSyncMain = subSyncMain;
exports.handlerMain = handlerMain;
