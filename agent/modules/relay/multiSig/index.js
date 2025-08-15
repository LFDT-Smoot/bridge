/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const { ServerAPI } = require('./serverApi.js')

const TimeoutPromise = require('@framework/utils/timeoutPromise.js');
const multiSignPromiseTimeout = 3 * 60 * 1000;
const POLL_INTERVAL = 5000; // 5 seconds
const RelayAbstract = require('@framework/relay/relay_abstract.js');
const context = require('@framework/context')
const EthWallet = require('@modules/wallet/eth_wallet.js');

module.exports = class multiSig extends RelayAbstract {
  constructor(url, logger = console) {
    super(url,logger);
    this.apiServer = this.getClient(url ? url : global.apiURL);

    const privateKey = context.getPrivateKey('relayWorker');
    this.workerWallet = EthWallet.fromPrivate(privateKey);
  }

  getClient(url) {
    let apiServer = new ServerAPI(url);
    return apiServer;
  }

  // setHashX(hashX) {
  //   this.hashX = hashX;
  // }

  // setSignData(signData) {
  //   this.signData = signData;
  // }

  async signByApprove(id, signData, extData) {
    const chainType = extData.chainType;
    const sigRet = await this.workerWallet.sign(signData);
    const threshold = global.config.crossTokens[chainType].CONF.multiSigThreshold;

    let signObj = {
      uniqueId: id,
      dataHash: signData.toString('hex'),
      pk: this.workerWallet.publicKey(),
      rawData: extData.encodedInfo,
      minSignCount: threshold,
      signature: sigRet.signature
    }

    const signObjToPrint = {...signObj};
    signObjToPrint.rawData = "..... has data but do not print .....";
    this.logger.info("multiSig signByApprove hashX:", this.hashX, " signObj:", JSON.stringify(signObjToPrint, null, 4));
    const traceMsg = ` hashX: ${this.id}, hashData: ${signData} `
    let exitCondition = { exist: false };

    let signResult;
    let self = this;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        // Step 1: Submit the transaction for signing
        const addResult = await this.apiServer.addTxForSign(chainType, signObj);
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
            const queryResult = await this.apiServer.queryTxSignature(chainType, id);

            if (queryResult.status && queryResult.result) {
              const { count, signatures } = queryResult.result;

              if (count < threshold) {
                continue;
              }
              // Filter out the leader's own signature
              const otherSignatures = signatures.filter(sig => sig.pk.toLowerCase() !== this.workerWallet.publicKey().toLowerCase());

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

  getForApprove(chainType) {
    const pk = this.workerWallet.publicKey();

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

  async approve(id, signData, extData) {
    const chainType = extData.chainType;

    const toByteArray = hexString =>
      new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    let signDataByteArray = toByteArray(signData);

    let signObj = {
      uniqueId: id,
      dataHash: signData,
      pk: this.workerWallet.publicKey(),
      rawData: extData.encodedInfo,
      minSignCount: global.config.crossTokens[chainType].CONF.multiSigThreshold,
      signature: (await this.workerWallet.sign(signDataByteArray)).signature
    }

    this.logger.info("approve hashX:", id, " this.signData:", JSON.stringify(signObj, null, 4));
    const traceMsg = ` hashX: ${id}, hashData: ${signData} `
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        const addResult = await this.apiServer.addTxSignature(chainType, signObj);
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