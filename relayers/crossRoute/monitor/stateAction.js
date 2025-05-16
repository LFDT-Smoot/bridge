/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict";
const {
  sleep
} = require('../comm/lib');

const {
  getChain
} = require("../chain/index.js");

const fs = require('fs');
const path = require("path");

const retryTimes = global.moduleConfig.retryTimes;
const retryWaitTime = global.moduleConfig.retryWaitTime;
const confirmTimes = global.moduleConfig.confirmTimes;

let actionMap = {
  destReceiveEvent: 'relayTask'
}

let actionTxHashMap = {
  destReceiveEvent: 'destReceiveTxHash'
}

module.exports = class StateAction {
  constructor(record, logger) {
    this.record = record;
    this.actionChain = record.actionChain;
    this.crossChain = record.crossChain;
    this.tokenType = record.tokenType;
    this.hashX = record.hashX;
    this.state = record.status;
    this.crossDirection = record.direction;
    this.logger = logger;

    this.retryTimes = retryTimes;

    let pendTime = global.testnet ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    if (!global.isLeader && (Number(this.record.timestamp) + pendTime) <= Date.now()) {
      this.logger.warn("Unfinished crossTrans error: pendTime meet, record timestamp is %s, while now is %s and pendTime is %s!", Number(this.record.timestamp), Date.now(), pendTime, 'hashX-', this.hashX);
      this.logger.warn("Unfinished crossTrans error: pendTime meet, crossTrans retryTime will be reduce from %s to 1!", this.retryTimes, 'hashX-', this.hashX);
      this.retryTimes = 0;
    }

    this.logger.debug("********************************** stateAction ********************************** hashX:", this.hashX, "status:", this.state, "retryTimes", this.retryTimes);
  }

  async updateRecord(content) {
    if (content.hasOwnProperty('status')) {
      this.state = content.status;
    }
    this.logger.info("********************************** updateRecord ********************************** hashX:", this.hashX, "content:", content);
    await global.modelOps.syncSave(this.hashX, content);
  }

  async updateState(state) {
    this.logger.info("********************************** updateState ********************************** hashX:", this.hashX, "status:", state);
    let content = {
      status: state,
    };
    await this.updateRecord(content);
  }

  async updateFailReason(action, err) {
    let error = (err.hasOwnProperty("message")) ? err.message : err;
    let failReason = action + ' ' + error;
    this.logger.debug("********************************** updateFailReason ********************************** hashX:", this.hashX, "failReason:", failReason);
    let content = {
      failAction: action,
      failReason: failReason
    };
    await this.updateRecord(content);
  }

  takeAction() {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        if (this.record.status === 'interventionPending' || !await self.checkHashTimeout()) {
          if (this.stateDict[self.state] && this.stateDict[self.state].hasOwnProperty('action')) {
            let action = this.stateDict[self.state].action;
            if (typeof (self[action]) === "function") {
              let paras = this.stateDict[self.state].paras;
              self.logger.info("********************************** takeAction ********************************** hashX:", self.hashX, action, paras)
              await self[action](...paras);
            }
          }
        }
        resolve();
      } catch (err) {
        self.logger.error("There is takeAction error", err, this.hashX);
        reject(err);
      }
    })
  }

  takeIntervention(nextState, rollState) {
    let mkdirsSync = function (dirname) {
      if (fs.existsSync(dirname)) {
        return true;
      } else {
        if (mkdirsSync(path.dirname(dirname))) {
          fs.mkdirSync(dirname);
          return true;
        }
      }
    }
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let issueCollection = global.config.issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '.txt';
    let content = JSON.stringify(this.record) + '\n';
    if (mkdirsSync(global.config.issueCollectionPath)) {
      fs.appendFile(issueCollection, content, async (err) => {
        if (!err) {
          this.logger.error("TakeIntervention done of hashX", issueCollection, this.record.hashX);
          await this.updateState(nextState);
        } else {
          this.logger.error("TakeIntervention failed of hashX", issueCollection, this.record.hashX, err);
          await this.updateState(rollState);
        }
      })
    }
  }

  async sendTrans(action, eventName, nextState, rollState) {
    this.logger.debug("sendTrans", this.record);

    let actionOnChain = this.record.actionChain;
    if (eventName !== null) {
      let event = this.record[eventName];
      if (event && event.length !== 0) {
        let content = {
          status: nextState[1],
          transConfirmed: 0
        }
        await this.updateRecord(content);
        return;
      }
    }

    if (!this.record.isUpdateAction) {
      let transHashName = actionTxHashMap[eventName];
      let txHashArray = this.record[transHashName];
      txHashArray = (Array.isArray(txHashArray)) ? [...txHashArray] : [txHashArray]
      if (txHashArray.length > 0) {
        this.logger.warn("********************************** sendTrans canceled because agent cannot avoid duplicate trans on this chain %s, plz check the trans %s for ********************************** hashX: %s", actionOnChain, txHashArray, this.hashX, "action:", action);
        let content = {
          status: nextState[0],
          transConfirmed: 0
        }
        await this.updateRecord(content);
        return;
      }
    }

    let result = {};
    let chainTxMutex;

    let newAgent = new global.agentDict[actionOnChain](this.record);
    try {
      if (this.record.transRetried !== 0) {
        await sleep(retryWaitTime);
      }

      this.logger.info("********************************** sendTrans begin ********************************** hashX:", this.hashX, "action:", action, chainTxMutex, global[chainTxMutex]);
      await newAgent.initAgentTransInfo(action);

      this.logger.info("********************************** sendTrans createTrans ********************************** hashX:", this.hashX, "action:", action, chainTxMutex, global[chainTxMutex]);
      await newAgent.createTrans(action);

      chainTxMutex = actionOnChain.toLowerCase() + 'TxMutex';

      if (!global[chainTxMutex]) {
        global[chainTxMutex] = true;
        this.logger.info("********************************** sendTrans set chainTxMutex ********************************** hashX:", this.hashX, "action:", action, chainTxMutex, global[chainTxMutex]);
      } else {
        this.logger.info("********************************** sendTrans pending waiting for chainTxMutex false ********************************** hashX:", this.hashX, "action:", action, chainTxMutex, global[chainTxMutex]);
        await sleep(1000);
        while (global[chainTxMutex]) {
          await sleep(2000);
        }
        global[chainTxMutex] = true;
        this.logger.info("********************************** sendTrans set chainTxMutex ********************************** hashX:", this.hashX, "action:", action, chainTxMutex, global[chainTxMutex]);
      }

      let content = await newAgent.sendTransSync();

      global[chainTxMutex] = false;
      this.logger.debug("sendTrans result is ", content);
      Object.assign(result, content);

      this.logger.info("********************************** sendTrans done ********************************** hashX:", this.hashX, "action:", action);

      if (!(this.record.transRetried > 0)) {
        result.transRetried = 0;
      }
      result.status = nextState[0];
    } catch (err) {
      chainTxMutex = actionOnChain.toLowerCase() + 'TxMutex';
      if (!global[chainTxMutex]) {
        global[chainTxMutex] = {};
      }

      global[chainTxMutex] = false;

      const bSupportAutoRetry = global.moduleConfig.crossInfoDict[actionOnChain].CONF.supportAutoRetry;

      this.logger.error("sendTransaction failed, action:", action, ", and record.hashX:", this.hashX, ", will retry, this record already transRetried:", this.record.transRetried, ", max this.retryTimes:", this.retryTimes, "actionOnChain: ", actionOnChain);
      this.logger.error("sendTransaction failed,  err is", err, this.hashX);
      if (global.isLeader && !err.hasOwnProperty("message") && (err.indexOf("multiSig signByApprove failed") >= 0)) {
        this.logger.error("********************************** sendTransaction failed at multiSig signByApprove and will retry ********************************** hashX", this.hashX, err);
        result.status = rollState[0];
        await this.updateFailReason(action, err);
      } else if (global.isLeader && newAgent && (!newAgent.__has_sendTrans_error__ || (newAgent.__has_sendTrans_error__ && bSupportAutoRetry))) {
        this.logger.error("********************************** sendTransaction failed at non-sending stage and will retry ********************************** hashX", this.hashX, err);
        result.status = rollState[0];
        await this.updateFailReason(action, err);
      } else if (this.record.transRetried < this.retryTimes) {
        result.transRetried = this.record.transRetried + 1;
        result.status = rollState[0];
        await this.updateFailReason(action, err);
      } else {
        result.transRetried = 0;
        result.status = rollState[1];
        await this.updateFailReason(action, err);
      }
      this.logger.error("sendTransaction failed, action:", action, result, this.hashX);
    }

    await this.updateRecord(result);
  }

  async checkTransOnline(eventName, transHashName, nextState, rollState) {
    let content = {};
    let transOnChain;
    let transConfirmed;

    transOnChain = this.record.actionChain;

    try {
      let transConfirmTimes = confirmTimes;
      let retryTimes = this.retryTimes;

      this.logger.debug("********************************** checkTransOnline checkEvent**********************************", eventName, transHashName, this.hashX, "max transConfirmTimes is", transConfirmTimes, "already transConfirmed", this.record.transConfirmed, "max retryTimes is", retryTimes, "already transRetried", this.record.transRetried);

      if (eventName !== null) {
        let event = this.record[eventName];
        transConfirmed = this.record.transConfirmed;

        if (event.length !== 0) {
          content = {
            status: nextState,
            transConfirmed: 0,
            transRetried: 0
          }

          await this.updateRecord(content);
          return;
        }
        if ((this.record.transRetried > retryTimes) || (transConfirmed >= transConfirmTimes && this.record.transRetried === retryTimes)) {
          content = {
            status: rollState[1],
            transConfirmed: 0,
            transRetried: 0
          }

          await this.updateFailReason(actionMap[eventName], "exceed retryTimes");
          await this.updateRecord(content);
          return;
        }
        if (transConfirmed >= transConfirmTimes && this.record.transRetried < retryTimes) {
          this.logger.warn("checkTransOnline confirm time exceed transConfirmTimes, will retry, this record already transRetried:", this.record.transRetried, ", max retryTimes:", retryTimes, eventName, this.hashX);

          content = {
            status: rollState[0],
            transConfirmed: 0,
            transRetried: this.record.transRetried + 1
          }

          await this.updateRecord(content);
          return;
        }
      }

      if (!global.isLeader || !this.record[transHashName] || this.record[transHashName].length === 0) {
        content = {
          transConfirmed: transConfirmed + 1
        }
        await this.updateRecord(content);
        return;
      }

      try {
        let receipt;
        let chain = getChain(transOnChain);
        let txHashArray = this.record[transHashName];
        txHashArray = (Array.isArray(txHashArray)) ? [...txHashArray] : [txHashArray];

        for (var txHash of txHashArray) {
          this.logger.debug("********************************** checkTransOnline checkHash**********************************", this.hashX, transHashName, txHash);

          let confirm_block_num = chain.confirm_block_num;

          receipt = await chain.getTransactionConfirmSync(txHash, confirm_block_num);
          if (receipt !== null) {
            if (receipt.status === '0x1' || receipt.status === true) {
              content = {
                status: nextState,
                transConfirmed: 0,
                transRetried: 0
              }

              break;
            } else {
              if (txHashArray.indexOf(txHash) === (txHashArray.length - 1) || txHashArray[txHashArray.length - 1] === txHash) {
                content = {
                  status: rollState[1],
                  transConfirmed: 0,
                  transRetried: 0
                }
                let failReason = 'txHash receipt is 0x0! Cannot find ' + eventName;
                await this.updateFailReason(actionMap[eventName], failReason);
              }
            }
          } else {
            if (txHashArray.indexOf(txHash) === (txHashArray.length - 1) || txHashArray[txHashArray.length - 1] === txHash) {
              if (this.record.transConfirmed < transConfirmTimes) {
                content = {
                  transConfirmed: transConfirmed + 1
                }
              }
            }
          }
        }

        await this.updateRecord(content);

      } catch (err) {
        this.logger.error("checkTransOnline:", err, this.hashX);
        throw new Error(err);
      }

    } catch (err) {
      this.logger.error("checkTransOnline:", err, this.hashX);
    }
  }
}