/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const context = require('./context');

async function saveTask(chainType, tasks, logger) {
  let cntPerTime = 200;
  let i = 0;
  let end;

  while (i < tasks.length) {
    if ((i + cntPerTime) > tasks.length) {
      end = tasks.length;
    } else {
      end = i + cntPerTime;
    }
    let taskArray = tasks.slice(i, end);

    logger.info("saveTask at chain %s while events whole length %s, each turn split %s event, current turn split event from %s to %s: ", chainType, tasks.length, cntPerTime, i, end);

    let multiEvents = [...taskArray].map( (task)=> global.modelOps.syncSave(...task) );

    try {
      await Promise.all(multiEvents);
      logger.debug("********************************** saveTask done **********************************", chainType);
    } catch (err) {
      logger.error("saveTask", err);
      return Promise.reject(err);
    }
    i += cntPerTime;
  }
}

async function syncChain(chainType, logger, saveDb = true, syncFrom, syncTo) {
  // let chainUrl = global.config.crossTokens[chainType].CONF.nodeUrl;

  let blockNumber = 0;
  let curBlock = 0;
  let crossAgent = context.getAgent(chainType);
  const chain = crossAgent.chain;

  if (!syncTo) {
    try {
      curBlock = await crossAgent.getBlockNumberSync();
      logger.info(`syncChain:: ${chainType} latest block is:`, curBlock, chainType);
    } catch (err) {
      logger.error("syncChain::getBlockNumberSync from :", chainType, err);
      throw new Error(err);
    }
  } else {
    syncTo = parseInt(syncTo, 10);
    curBlock = syncTo;
  }

  if (!syncFrom) {
    try {
      blockNumber = await global.modelOps.getScannedBlockNumberSync(chainType);

      if (blockNumber > chain.safe_block_num) {
        blockNumber -= chain.safe_block_num;
      } else {
        blockNumber = (curBlock > chain.trace_block_num) ? curBlock - chain.trace_block_num : 0;
      }
    } catch (err) {
      logger.error("syncChain::getScannedBlockNumberSync from :", chainType, err);
      throw new Error(err);
    }
  } else {
    syncFrom = parseInt(syncFrom, 10);
    blockNumber = syncFrom;
  }

  logger.info("syncChain::Current Chain %s sync will start from block: %s, saveDb: %s", chainType, blockNumber, saveDb);

  let from = blockNumber;


  if (curBlock > chain.confirm_block_num) {
    let to = curBlock - chain.confirm_block_num;
    if (syncTo) {
      to = syncTo;
    }

    try {
      if (from <= to) {
        let blkIndex = from;
        let blkEnd;
        let range = to - from;
        let cntPerTime = chain.sync_interval_block_num;

        while (blkIndex < to) {
          if ((blkIndex + cntPerTime) > to) {
            blkEnd = to;
          } else {
            blkEnd = blkIndex + cntPerTime;
          }

          logger.info("syncChain::blockSync chain ", chainType, "saveDb ", saveDb, "range: From", from, " to", to, " remain ", range, ", current round FromBlk:", blkIndex, ", ToBlk:", blkEnd);

          let contents = await crossAgent.getCrossMessageTask(blkIndex,blkEnd);
          
          if (saveDb) {
            if(contents.length > 0){
              await saveTask(chainType, contents, logger);
            }
            await global.modelOps.syncSaveScannedBlockNumber(chainType, blkEnd);
            logger.info("********************************** syncChain::saveState **********************************", chainType, blkEnd);
          } else {
            logger.info("********************************** syncChain::chain %s saveDb %s done! **********************************", chainType, saveDb);
          }

          blkIndex += cntPerTime;
          range -= cntPerTime;
        }
      }
    } catch (err) {
      logger.error("syncChain from :", chainType, err);
      throw new Error(err);
    }
  }
}

// exports.getChain = getChain;
exports.syncChain = syncChain;
