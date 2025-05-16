/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const { ServerAPI } = require('./serverApi')

const TimeoutPromise = require('../utils/timeoutPromise.js');
const multiSignPromiseTimeout = 3 * 60 * 1000;
const POLL_INTERVAL = 5000; // 5 seconds

module.exports = class multiSig {
  constructor(url, logger = global.multisigLogger ? global.multisigLogger : console) {
    this.apiServer = this.getClient(url ? url : global.apiURL);
    this.logger = logger;
  }

  getClient(url) {
    let apiServer = new ServerAPI(url);
    return apiServer;
  }

  setHashX(hashX) {
    this.hashX = hashX;
  }

  setSignData(signData) {
    this.signData = signData;

    return this.signData;
    this.logger.debug("********************************** multiSig setSignData **********************************", this.signData, "hashX:", this.hashX);
  }

  async signByApprove(chainType, leaderPk, signData, threshold) {
    if (signData) {
      this.signData = signData;
    }
    signData.minSignCount = threshold;
    this.logger.info("multiSig signByApprove hashX:", this.hashX, " this.signData:", JSON.stringify(this.signData, null, 4));
    const traceMsg = ` hashX: ${this.hashX}, hashData: ${this.signData.dataHash} `
    let exitCondition = { exist: false };

    let signResult;
    let self = this;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        // Step 1: Submit the transaction for signing
        const addResult = await this.apiServer.addTxForSign(chainType, signData);
        if (!addResult.status) {
          let err = addResult.err ? addResult.err : 'Failed to submit transaction for signing';
          // this.logger.error("********************************** multiSig signByApprove failed **********************************", traceMsg, err);
          throw new Error(err);
        }

        const startTime = Date.now();
        // Step 2-5: Poll for signatures
        while (Date.now() - startTime < multiSignPromiseTimeout && exitCondition && !exitCondition.exist) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

          try {
            const queryResult = await this.apiServer.queryTxSignature(chainType, signData.uniqueId);

            if (queryResult.status && queryResult.result) {
              const { count, signatures } = queryResult.result;
  
              if (count < threshold) {
                continue;
              }
              // Filter out the leader's own signature
              const otherSignatures = signatures.filter(sig => sig.pk !== leaderPk);
  
              if (otherSignatures.length >= threshold - 1) {  // -1 because the leader's signature is not included
                signResult = signatures;
                break;
              }
            } else {
              let err = queryResult.err ? queryResult.err : 'Failed to submit transaction for signing';
              // self.logger.error("********************************** multiSig queryTxSignature failed **********************************", traceMsg, err);
              throw new Error(err);
            }
          } catch (err) {
            self.logger.error("********************************** multiSig queryTxSignature failed **********************************", traceMsg, err);
          }
        }

        resolve(signResult);
      } catch (err) {
        self.logger.error("********************************** multiSig signByApprove failed **********************************", traceMsg, err);
        reject("multiSig signByApprove failed: " + (err.hasOwnProperty("message") ? err.message : err));
      }
    }, multiSignPromiseTimeout, `multiSig signByApprove Timeout. ${traceMsg}`, exitCondition);
  }

  getForApprove(chainType, pk) {
    this.logger.info("getForApprove for chainType %s, pk %s", chainType, pk);
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        const queryResult = await this.apiServer.queryTxForSign(chainType, pk);
        if (!queryResult.status) {
          let err = addResult.err ? addResult.err : 'Failed to queryResult transaction for signing';
          // this.logger.error("********************************** multiSig getForApprove failed **********************************", err);
          reject((err.hasOwnProperty("message") ? err.message : err));
        } else {
          this.logger.debug("********************************** multiSig getForApprove successfully **********************************");
          resolve(queryResult.result);
        }
      } catch (err) {
        this.logger.error("********************************** multiSig getForApprove failed **********************************", err);
        reject((err.hasOwnProperty("message") ? err.message : err));
      }
    }, multiSignPromiseTimeout, "multiSig getForApprove Timeout");
  }

  approve(chainType, signData) {
    if (signData) {
      this.signData = signData;
    }
    this.logger.info("approve hashX:", this.hashX, " this.signData:", JSON.stringify(this.signData, null, 4));
    const traceMsg = ` hashX: ${this.hashX}, hashData: ${this.signData.dataHash} `
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        const addResult = await this.apiServer.addTxSignature(chainType, this.signData);
        if (!addResult.status) {
          let err = addResult.err ? addResult.err : 'Failed to approve transaction for signing';
          // this.logger.error("********************************** multiSig approve failed **********************************", traceMsg, err);
          reject((err.hasOwnProperty("message") ? err.message : err));
        } else {
          this.logger.debug("********************************** multiSig approve successfully **********************************", traceMsg, addResult);
          resolve(addResult);
        }
      } catch (err) {
        this.logger.error("********************************** multiSig approve failed **********************************", traceMsg, err);
        reject((err.hasOwnProperty("message") ? err.message : err));
      }
    }, multiSignPromiseTimeout, `multiSig approve Timeout. ${traceMsg}`);
  }
}