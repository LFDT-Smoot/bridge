/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const ChainModel = require('./ethBase');
const Stellar = require('./stellar');

function getChain(chainType, logger = global.syncLogger ? global.syncLogger : console, nodeUrl) {
  if (chainType === 'MATIC') {
    return new ChainModel(logger, nodeUrl, chainType);
  } else if (chainType === 'XLM') {
    return new Stellar(logger, nodeUrl, chainType);
  } else {
    return null;
  }
}

async function getScEvents(logger, chain, scAddr, topics, fromBlk, toBlk) {
  let events;
  let cntPerTime = 500;
  try {
    events = await chain.getScEventSync(scAddr, topics, fromBlk, toBlk);
  } catch (err) {
    const chainType = chain ? chain.chainType : "";
    logger.error(`chain: ${chainType} scAddr: ${JSON.stringify(scAddr)} getScEvents`, err);
    return await Promise.reject(err);
  }

  let i = 0;
  let end;
  logger.info("events length: ", chain.chainType, events.length, JSON.stringify(scAddr));

  while (i < events.length) {
    if ((i + cntPerTime) > events.length) {
      end = events.length;
    } else {
      end = i + cntPerTime;
    }
    let arr = events.slice(i, end);
    let multiEvents = [...arr].map((event) => {
      return new Promise(async (resolve, reject) => {
        if (event === null) {
          logger.debug("event is null")
          resolve();
        }
        try {
          if (!event.timestamp) {
            if (!global.chainBlock) {
              global.chainBlock = {};
            }
            if (!global.chainBlock[chain.chainType]) {
              global.chainBlock[chain.chainType] = [];
            }
            if (global.chainBlock[chain.chainType][event.blockNumber]) {
              event.timestamp = global.chainBlock[chain.chainType][event.blockNumber];
            } else {
              event.timestamp = parseInt(Date.now() / 1000);
              global.chainBlock[chain.chainType][event.blockNumber] = event.timestamp;
            }
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    try {
      await Promise.all(multiEvents);
    } catch (err) {
      logger.error("getScEvents", err);
      return await Promise.reject(err);
    }
    i += cntPerTime;
  }
  return events;
}

async function splitEvent(chainType, events, logger) {
  let cntPerTime = 200;
  let i = 0;
  let end;

  while (i < events.length) {
    if ((i + cntPerTime) > events.length) {
      end = events.length;
    } else {
      end = i + cntPerTime;
    }
    let eventArray = events.slice(i, end);

    logger.info("splitEvent at chain %s while events whole length %s, each turn split %s event, current turn split event from %s to %s: ", chainType, events.length, cntPerTime, i, end);

    let multiEvents = [...eventArray].map((event) => {
      return new Promise(async (resolve, reject) => {
        try {
          let crossAgent = new global.agentDict[chainType]();

          let decodeEvent;

          if (crossAgent.contract) {
            decodeEvent = crossAgent.contract.parseEvent(event);
          } else {
            decodeEvent = event;
          }

          let content;
          if (decodeEvent === null || decodeEvent === undefined) {
            resolve();
            return;
          } else {
            content = await crossAgent.getDecodeEventDbData(decodeEvent);
          }

          if (content !== null) {
            await global.modelOps.syncSave(...content);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    try {
      await Promise.all(multiEvents);
      logger.debug("********************************** splitEvent done **********************************", chainType);
    } catch (err) {
      logger.error("splitEvent", err);
      return await Promise.reject(err);
    }
    i += cntPerTime;
  }
}

async function syncChain(chainType, logger, saveDb = true, syncFrom, syncTo) {
  let chainUrl = global.config.crossTokens[chainType].CONF.nodeUrl;

  let blockNumber = 0;
  let curBlock = 0;
  let chain = getChain(chainType, logger, chainUrl);

  logger.info("********************************** syncChain **********************************", chainType, "url is ", chainUrl,
    "safe_block_num is", chain.safe_block_num, "confirm_block_num is", chain.confirm_block_num, "sync_interval_block_num is", chain.sync_interval_block_num, "sync_interval_time is", chain.sync_interval_time);

  if (!syncTo) {
    try {
      curBlock = await chain.getBlockNumberSync();
      logger.info("syncChain::Current block is:", curBlock, chainType);
    } catch (err) {
      logger.error("syncChain::getBlockNumberSync from :", chainType, err);
      throw new Error(err);
      return;
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
      return;
    }
  } else {
    syncFrom = parseInt(syncFrom, 10);
    blockNumber = syncFrom;
  }

  logger.info("syncChain::Current Chain %s sync will start from block: %s, saveDb: %s", chainType, blockNumber, saveDb);

  let from = blockNumber;
  let topics = [];
  let events = [];

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

          let scAddr = [].concat(global.tokenList[chainType].crossScAddr);

          if (chain.matchAllScAddressPerScan) {
            events = await getScEvents(logger, chain, scAddr, topics, blkIndex, blkEnd);
          }
          else {
            for (let scAddress of scAddr) {
              let scEvents = await getScEvents(logger, chain, scAddress, topics, blkIndex, blkEnd);
              events = events.concat(scEvents);
            }
          }

          logger.info("syncChain::events chainType %s saveDb %s length %s", chainType, saveDb, events.length);
          if (events.length > 0) {
            await splitEvent(chainType, events, logger);
          }
          events = [];
          if (saveDb) {
            await global.modelOps.syncSaveScannedBlockNumber(chainType, blkEnd);
            logger.info("********************************** syncChain::saveState **********************************", chainType, blkEnd);
          } else {
            logger.info("********************************** syncChain::chain %s saveDb %s done! **********************************", chainType, saveDb, blkEnd);
          }

          blkIndex += cntPerTime;
          range -= cntPerTime;
        }
      }
    } catch (err) {
      logger.error("syncChain from :", chainType, err);
      throw new Error(err);
      return;
    }
  }
}

exports.getChain = getChain;
exports.syncChain = syncChain;
