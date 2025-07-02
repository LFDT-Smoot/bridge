/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const RelayTask = require("../monitor/relayCross");

global.handlingList = {};

/* When agent restart, change all waitingIntervention state to interventionPending, to auto retry the test*/
async function updateRecordAfterRestart(logger) {
  let option = {
    status: {
      $in: ['waitingIntervention']
    },
    crossChain: {
      $nin: []
    }
  }
  let changeList = await global.modelOps.getEventHistory(option);
  let content = {
    status: 'interventionPending'
  }
  logger.debug('changeList length is ', changeList.length);
  for (let i = 0; i < changeList.length; i++) {
    let record = changeList[i];

    if (record.destReceiveTxHash && record.destReceiveTxHash.length > 0) {
      continue;
    }

    await global.modelOps.syncSave(record.hashX, content);
  }
  logger.debug('updateRecordAfterRestart finished!');
}

function initStateAction(record) {
  let StateAction = RelayTask;

  return StateAction;
}

function monitorRecord(record, logger) {
  let StateAction = initStateAction(record);

  let stateAction = new StateAction(record, logger);
  stateAction.takeAction()
    .then(result => {
      if (global.handlingList[record.hashX]) {
        logger.debug("global.handlingList delete already handled hashX", record.hashX);
        delete global.handlingList[record.hashX];
      }
    })
    .catch(err => {
      if (global.handlingList[record.hashX]) {
        logger.debug("global.handlingList delete already handled hashX", record.hashX);
        delete global.handlingList[record.hashX];
      }
      logger.error(err)
    });
}

async function monitorHandler(logger) {
  try {
    if (global.agentRestart) {
      await updateRecordAfterRestart(logger);
    }

    // crossTrans will not handle those older trans happened pendTime ago;
    let pendTime = global.testnet ?  7 * 24 * 60 * 60 * 1000 :  4 * 7 * 24 * 60 * 60 * 1000;
    let option = {
      actionChain: {
        $in: [...global.tokenList.supportChains].filter((chain) => {return chain !== ''})
      },
      originChain: {
        $in: [...global.tokenList.supportChains].filter((chain) => {return chain !== ''})
      },
      crossChain: {
        $in: [...global.tokenList.supportChains].filter((chain) => {return chain !== ''})
      },
      crossScAddr: {
        $in: [...global.tokenList.crossScAddr]
      },
      timestamp: {
        $gte: Date.now() - pendTime
      },
      hashX: {
        $nin: Object.keys(global.handlingList)
      }
    }

    if (global.agentRestart) {
      option.status = {
        $nin: ['redeemFinished', 'waitingIntervention']
      }
      global.agentRestart = false;
    } else {
      option.status = {
        $nin: ['redeemFinished', 'waitingIntervention', 'interventionPending']
      }
    }

    let history = await global.modelOps.getEventHistory(option);
    logger.debug('monitorHandler history length is ', history.length);
    logger.debug('global.handlingList length is ', Object.keys(global.handlingList).length);

    for (let i = 0; i < history.length; i++) {
      let record = history[i];
      let cur = Date.now();
      if (global.handlingList[record.hashX]) {
        continue;
      }

      try {
        global.handlingList[record.hashX] = cur;
        monitorRecord(record, logger);
      } catch (err) {
        logger.error("monitorRecord error:", err);
      }
    }
  } catch (err) {
    logger.error("monitorHandler error:", err);
  }
}


exports.monitorRecord = monitorRecord;
exports.monitorHandler = monitorHandler;
