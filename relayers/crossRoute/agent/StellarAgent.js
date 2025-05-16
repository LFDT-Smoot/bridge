/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const {
  hexAdd0x,
  hexTrip0x,
  getChainSymbolByChainId,
  sleep
} = require('../comm/lib');

const {
  getChain
} = require('../chain/index.js')

if (!global.moduleConfig) {
  global.moduleConfig = require('../conf/moduleConfig.js');
}

const MultiSig = require('../multiSig/index.js')

global.convertDict = require('../convert/index.js').convertDict;

const { toBN, toWei, padLeft } = require('web3-utils');
const ethUtil = require('ethereumjs-util');

let stellarRawTransModel = require("../trans/StellarRawTransModel.js");

const txBuilder = require("../utils/stellar/tx_builder");

const agentUtils = require("./utils");
const stellartUtils = require("../utils/stellar/utils");

const secp256k1 = require('secp256k1');
const {keccak256} = require("ethereumjs-util");

let g_printStellarPubKeyDone = false;

module.exports = class StellarAgent {
  constructor(record = null, chainType = "XLM", logger = global.syncLogger ? global.syncLogger : console) {
    this.logger = logger;
    this.config = global.config;
    this.chainType = chainType;
    this.chain = getChain(this.chainType.toUpperCase(), this.logger, this.config.crossTokens[chainType].CONF.nodeUrl);

    this.crossConf = this.config.crossTokens[this.chainType].CONF;
    this.crossTokens = this.config.crossTokens[this.chainType].TOKEN;

    this.chainID = this.crossConf.chainID;
    this.transChainID = this.crossConf.transChainID;

    if (process.env && process.env.PRIVATE_KEY) {
      let account = agentUtils.getAccountFromPrivateKey(process.env.PRIVATE_KEY);
      this.agentAddress = account.address.toLowerCase();
      if (!global.privateKey) {
        global.privateKey = {}
      }
      global.privateKey[this.agentAddress] = Buffer.from(hexTrip0x(process.env.PRIVATE_KEY), 'hex');
    } else {
      this.agentAddress = global.agentAddr ? global.agentAddr : this.crossConf.agentAddr;
    }

    this.isLeader = global.isLeader ? true : false
    this.multiSignature = global.moduleConfig.multiSignature;

    this.networkName = global.moduleConfig.network;
    this.crossInfo = global.moduleConfig.crossInfoDict[this.chainType];

    this.contractAddr = this.crossInfo.CONTRACT.gatewayAddr;

    this.transChainNonceless = this.crossInfo ? this.crossInfo.CONF.nonceless : false;

    this.relayFunc = this.crossInfo.FUNCTION.Relay;
    this.relayEvent = this.crossInfo.EVENT.Relay;

    this.record = record;

    if (record !== null) {
      this.setRecord(record);
      this.relayFunc = this.crossInfo.FUNCTION.Relay.dest[0];
    }

    this.RawTrans = stellarRawTransModel;

    if(!g_printStellarPubKeyDone) {
      const seed = this.getStellarEd25519Seed();
      const keyPair = stellartUtils.getKeyPairFromEd25519Seed(seed);
      this.logger.info("Stellar Account is:", keyPair.publicKey());
      g_printStellarPubKeyDone = true;
    }
  }

  setRecord(record) {
    this.record = record;

    this.hashX = record.hashX;
    if (record.x !== '0x') {
      this.key = record.x;
    }

    this.originChain = record.originChain;
    this.crossChain = record.crossChain;
    this.crossChainID = record.crossChainID;

    this.amount = record.value;
    this.crossAddress = record.crossAddress;
  }

  setKey(key) {
    this.key = key;
  }
  setHashX(hashX) {
    this.hashX = hashX;
  }

  stringToHex(str) {
    const buf = Buffer.from(str, 'utf8');
    return buf.toString('hex');
  }

  hexToString(str) {
    const buf = Buffer.from(str, 'hex');
    return buf.toString('utf8');
  }

  numToHex(num) {
    return num < 16 ? "0x0" + num.toString(16).toUpperCase() : "0x" + num.toString(16).toUpperCase();
  }

  async getNonce(address) {
    if (!this.isLeader) {
      return 0;
    }
    let nonce = await this.chain.getNonceSync(address);
    return nonce;
  }

  async initAgentTransInfo(action) {
    if (action !== null) {
      let transInfo = await this.getTransInfo(action);
      this.trans = new this.RawTrans(...transInfo, this.transChainID, this.chainType);
    }
  }

  async createTrans(action) {
    return new Promise(async (resolve, reject) => {
      try {
        if (action === 'relayTask') {
          this.data = await this.getRelayTaskData();
          this.build = this.buildRelayTaskData;
        }

        if (!this.transChainNonceless) {
          let gasPrice = await this.getGasPrice();
          this.trans.setGasPrice(gasPrice);
          this.logger.info("********************************** setGasPrice **********************************", "chain:", this.chainType, " agentAddress: ", this.agentAddress, "hashX", this.hashX, JSON.stringify(gasPrice, null, 0));

          let nonce = await this.getNonce(this.agentAddress);
          this.trans.setNonce(nonce);
          this.logger.info("********************************** setNonce **********************************", "chain:", this.chainType, " agentAddress: ", this.agentAddress, nonce, "hashX", this.hashX);
        }

        this.logger.info("********************************** setData **********************************", JSON.stringify(this.data, null, 0), "hashX", this.hashX);
        this.trans.setData(this.data);

        this.logger.info("********************************** setValue **********************************", 0, "hashX", this.hashX);
        this.trans.setValue(0);

        if (this.record.srcTransferEvent && this.record.srcTransferEvent[0].gasLimit) {
          let internalGasLimit = toBN(this.record.srcTransferEvent[0].gasLimit);

          let gasLimit = Math.max(toBN(this.crossConf.gasLimit).add(internalGasLimit), toBN(this.crossConf.gasLimit * 1.5));

          let maxGasLimit;
          if (this.crossConf.maxGasLimit || global.moduleConfig.maxGasLimit) {
            maxGasLimit = this.crossConf.maxGasLimit ? this.crossConf.maxGasLimit : global.moduleConfig.maxGasLimit;
            gasLimit = Math.min(gasLimit, toBN(maxGasLimit));
          }
          this.trans.setGasLimit(gasLimit);
          this.logger.info("********************************** setGasLimit **********************************, hashX", this.hashX, gasLimit.toString(10), "while internalGasLimit is ", internalGasLimit.toString(10), "and maxGasLimit is ", maxGasLimit.toString(10));
        }

        resolve();
      } catch (err) {
        this.logger.error("createTrans failed, hashX", this.hashX, err);
        reject("createTrans: " + err);
      }
    })
  }

  // WYH: common code, place in base/abstract class!
  getTransInfo(action) {
    let from;
    let to;
    let amount;
    let gas;
    let gasPrice = 0;
    let nonce = 0;

    return new Promise(async (resolve, reject) => {
      try {
        from = this.agentAddress;
        to = this.contractAddr;
        amount = this.amount;
        gas = this.crossConf.gasLimit;

        this.logger.info("transInfo is: action- %s, chainType- %s, from- %s, to- %s, gas- %s, gasPrice- %s, nonce- %s, amount- %s, hashX- %s", action, this.chainType, from, to, gas, gasPrice, nonce, amount, this.hashX);
        resolve([from, to, gas, gasPrice, nonce, amount]);
      } catch (err) {
        this.logger.error("getTransInfo failed", err);
        reject(err);
      }
    });
  }

  // gasPrice in wei
  // maxGasPrice/gasDelta in gwei
  async getGasPrice() {
    return 0;  // TODO: verify and clear this.

    if (!this.isLeader) {
      return 0;
    }
    let gasPrice;

    return new Promise(async (resolve, reject) => {
      try {
        let [chainGasPrice, block] = await Promise.all([
          this.chain.getGasPriceSync(),
          this.chain.getBlockByNumberSync("latest")
        ])
        //...
        resolve(gasPrice);
      } catch (err) {
        this.logger.error("getGasPrice failed", err);
        reject(err);
      }
    });
  }

  sendTransSync() {
    return new Promise((resolve, reject) => {
      this.sendTrans((err, result) => {
        if (!err && result !== null) {
          resolve(result);
        } else {
          reject(err);
        }
      });
    });
  }

  async sendTrans(callback) {
    this.logger.info("********************************** sendTransaction ********************************** hashX", this.hashX, this.chainType);
    let self = this;
    try {
      let rawTx;
      if (this.isLeader) {
        this.logger.info("********************************** sendTransaction get signature ********************************** hashX", this.hashX, this.chainType, this.trans);
        rawTx = await this.signTrans();
        this.logger.info("********************************** sendTransaction get signature successfully ********************************** hashX", this.hashX, this.chainType, (rawTx instanceof Uint8Array) ? `Uint8Array(${rawTx.length})` : rawTx);

        this.__has_sendTrans_error__ = false;
        let result = null
        try {
          result = await this.chain.sendRawTransactionSync(rawTx);

          try {
            let receipt = await this.chain.getTransactionConfirmSync(result, 0);
            if (receipt === null) {
              self.logger.warn("sendRawTransactionSync chainType %s result %s while receipt is null, hashX: ", this.chainType, result, self.hashX);
            }
          } catch (err) {
            self.logger.warn("getTransactionConfirmSync chain %s txHash %s failed: hashX: %s", this.chainType, result, self.hashX);
          }

          self.logger.info("sendRawTransactionSync result: hashX: ", self.hashX, this.chainType, result);
          self.logger.info("********************************** sendTransaction success ********************************** hashX", self.hashX, this.chainType);
          let content = self.build(self.hashX, result);
          callback(null, content);
        } catch (e) {
          this.__has_sendTrans_error__ = true
          throw e;
        }
      }
    } catch (err) {
      this.logger.error("********************************** sendTransaction failed ********************************** hashX", this.hashX, this.chainType, err);
      callback(err, null);
    }
  }

  async signMessage(messageHash) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        let privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : self.getPrivateKeyFromKeystore(this.agentAddress);
        let privateKeyBuffer = Buffer.from(hexTrip0x(privateKey), 'hex');

        const signature = ethUtil.ecsign(messageHash, privateKeyBuffer);

        const combinedSignature = ethUtil.toRpcSig(signature.v, signature.r, signature.s);
        this.logger.debug('signMessage messageHash %s signature result is %s, hashX %s', messageHash.toString('hex'), combinedSignature, this.hashX);

        let signResult = {
          sigR: hexAdd0x(signature.r.toString('hex')),
          sigS: hexAdd0x(signature.s.toString('hex')),
          sigV: signature.v,
          signature: combinedSignature
        }
        resolve(signResult);
      } catch (err) {
        this.logger.error("********************************** signMessage failed ********************************** hashX", this.hashX);
        reject(err);
      }
    });
  }

  verifySignature(messageHash, signature, expectedSigner) {
    try {
      const sig = ethUtil.fromRpcSig(signature);

      const publicKey = ethUtil.ecrecover(
        ethUtil.toBuffer(messageHash),
        sig.v,
        sig.r,
        sig.s
      );

      const recoveredAddress = hexAdd0x(ethUtil.pubToAddress(publicKey).toString('hex'));
      const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();

      this.logger.debug('verifySignature is valid:', isValid);
      this.logger.debug('Recovered address:', recoveredAddress);

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying signature:', error);
      return false;
    }
  }

  signTrans() {
    return new Promise((resolve, reject) => {
      try {
        // 1) use stellar private key to sign tx for submit.
        // 2) the stellar private key is different from generate
        let seed = this.getStellarEd25519Seed();
        resolve(this.trans.sign(seed));
      } catch (err) {
        this.logger.error("********************************** signTrans failed ********************************** hashX", this.hashX);
        reject(err);
      }
    });
  }

  generateTransData(crossFunc, ...params) {
    // return this.contract.constructData(crossFunc, ...params);
    //TODO:
  }

  //================================================================ used when building Transaction:
  // virtual function:
  /**
   *
   * @param taskId
   * @param networkId
   * @param contractAddress
   * @param functionCallData:  is a js object represent for final-function-call-data.
   * @returns {*}  String type value.
   */
  convertEncodeInfo(taskId, networkId, contractAddress, functionCallData) {
    const converter = global.convertDict[this.chainType];
    let functionCallDataXdrBytes = functionCallData;
    if( typeof functionCallData === 'string') {
      functionCallDataXdrBytes = Buffer.from(functionCallData, "hex");
    }else if( !( functionCallData instanceof Buffer) ) {
      throw new Error("Invalid functionCallData")
    }

    return converter.getEncodeInfo(taskId, networkId, contractAddress, functionCallDataXdrBytes);
  }

  // virtual function:
  /**
   *
   * @param signatures: a list of signatures
   * @returns {*}  String type value.
   */
  convertEncodeProof(signatures) {
    const converter = global.convertDict[this.chainType];
    signatures = this._convertSignatures(signatures); // convert to stellar format.
    return converter.getEncodeProof(signatures);
  }

  /**
   * Convert {r,s,v} format signatures to the required input format of getEncodeProof() in stellar converter
   * @param signatures
   * @returns {*}
   */
  _convertSignatures(signatures) {
    // input is array of [by, r, s, v, meta]
    return signatures.map(sig => {
      const _signature =  hexTrip0x(sig[1]) + hexTrip0x(sig[2]);
      const sig_buf = Buffer.from(_signature,"hex");
      const uint8Array = new Uint8Array(sig_buf);
      return {
        signature: uint8Array,
        recid: sig[3] - 27
      }
    })
  }


  async getRelayTaskData() {
    this.logger.debug("********************************** funcInterface **********************************", this.relayFunc, "hashX", this.hashX);
    this.logger.debug('getRelayTaskData: chainType-', this.chainType, 'chainID-', this.chainID, 'hashX-', this.hashX, 'crossAddress-', this.crossAddress, 'message gasLimit', this.record.srcTransferEvent[0].gasLimit);

    if ( this.multiSignature || global.moduleConfig.multiSignature ) {

      let params = [];

      const msgBridgeContractAddress = this.contractAddr;

      //Note: `this.record.extData` is an encoded-final-function-call-data that persistent into DB.
      let functionCallData = this.record.extData;
      let encodedInfo = this.convertEncodeInfo(this.hashX, this.chainID, this.crossAddress, functionCallData);

      // Test: just use one signature:
      // const sha256hash = keccak256(encodedInfo);
      // const secp256k1_user1_privKey = "ee5abbc9f30f7c9d2c5dd6ed8283719e4a3239b58b72e3352001c5a8e44923fc";
      // const user1_secp256k1_privKey = Buffer.from(secp256k1_user1_privKey,'hex');
      // let user1_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user1_secp256k1_privKey);
      // Test end.

      let internalSignature = await this.internalSignViaMultiSig(encodedInfo);

      if (this.isLeader) {
        let signatures = agentUtils.convertSignatures(internalSignature);
        let encodedProof = this.convertEncodeProof(signatures);
        this.logger.debug("********************************** funcInterface constructData **********************************", this.relayFunc, params, "hashX", this.hashX);

        const stellarSeed = this.getStellarEd25519Seed();
        const pubKey = (stellartUtils.getKeyPairFromEd25519Seed(stellarSeed)).publicKey();
        const preparedTransaction = await txBuilder.inBoundCallTxBuilder(msgBridgeContractAddress, pubKey, {
          chainID: this.chainID,
          encodedInfo: Buffer.from(encodedInfo, "hex"),
          encodedProof: Buffer.from(encodedProof, "hex")
        })

        return preparedTransaction;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }


  buildRelayTaskData(hashX, result) {
    let txHashName = "destReceiveTxHash";
    this.logger.debug("********************************** insertRelayTaskData trans **********************************", txHashName, hashX);

    let content = {};
    content[txHashName] = (Array.isArray(this.record[txHashName])) ? [...this.record[txHashName]] : [this.record[txHashName]]

    content[txHashName].push(result);
    content['actionTime'] = parseInt(new Date().getTime());
    return content;
  }

  async prepareSignData(encodedInfo) {
    const messageHash = ethUtil.keccak256(Buffer.from(encodedInfo, "hex"));
    let signature = await this.signMessage(messageHash)

    let pk = global.tokenList[this.chainType].pk;
    let signDataObj = {
      "uniqueId": this.hashX,
      "dataHash": messageHash.toString('hex'),
      "pk": hexTrip0x(pk),
      "signature": signature,
      "rawData": encodedInfo
    }

    return signDataObj;
  }

  internalSignViaMultiSig(encodedInfo) {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info("********************************** internalSignViaMultiSig ********************************** hashX", this.hashX, "encodedInfo.length: ", encodedInfo.length);

        let signData = await this.prepareSignData(encodedInfo);
        this.logger.info("********************************** prepareSignData Via MultiSig ********************************** hashX", this.hashX, signData);

        signData.signature = signData.signature.signature;
        let multiSig = new MultiSig();
        multiSig.setHashX(this.hashX);
        multiSig.setSignData(signData);

        let threshold = this.crossConf.multiSigThreshold;
        let multiSignatureResult;
        if (this.isLeader) {
          this.logger.info("********************************** getInternalSign Via MultiSig ********************************** hashX", this.hashX, signData);

          multiSignatureResult = await multiSig.signByApprove(this.chainType, signData.pk, signData, threshold);
          this.logger.info("********************************** getInternalSign Via MultiSig Success********************************** hashX", this.hashX, JSON.stringify(multiSignatureResult, null, 0));
        } else {
          this.logger.info("********************************** validateInternalSign Via MultiSig ********************************** hashX", this.hashX, signData);

          multiSignatureResult = await multiSig.approve(this.chainType, signData);
          this.logger.info("********************************** validateInternalSign Via MultiSig Success********************************** hashX", this.hashX);
        }

        resolve(multiSignatureResult);
      } catch (err) {
        this.logger.error("********************************** internalSignViaMultiSig failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    })
  }

  getDecodeEventCrossScAddr(decodeEvent) {
    return decodeEvent.address;
  }

  getDecodeCrossAddress(decodeEvent) {
    return decodeEvent.args.userAccount;
  }

  async getDecodeEventDbData(decodeEvent) {
    let content = {};
    let args = decodeEvent.args;
    let eventName = decodeEvent.event;

    decodeEvent.chainType = this.chainType;

    this.logger.debug("********************************** 0: getDecodeEventDbData ********************************** eventName:", eventName, decodeEvent.transactionHash);

    if (!args.xHash && !args.uniqueID) {
      if ([].concat(this.relayEvent.src, this.relayEvent.dest).includes(eventName)) {
        args.xHash = decodeEvent.args.taskId;
      } else {
        this.logger.debug("********************************** getDecodeEventDbData ********************************** hashX not included", " on Chain:", this.chainType, "transactionHash is", decodeEvent.transactionHash);
        return null;
      }
    }

    let hashX = (args.xHash) ? args.xHash : args.uniqueID;
    hashX = hexAdd0x(hashX);

    let option = {
      hashX: hashX
    };
    let recordInDb = await global.modelOps.getEventHistory(option);

    let crossChainID, crossChain;
    try {
      if (args.functionCallData) { // decode bytes string into js object
        decodeEvent.functionCallData = this.decodeFinalFunctionCallData(this.chainType, args.functionCallData);
      }

      if (([].concat(this.relayEvent.src)).includes(eventName)) {
        try {
          crossChainID = decodeEvent.args.networkId;
          crossChain = getChainSymbolByChainId(crossChainID);
          if (!global.tokenList.supportChains.includes(crossChain)) {
            this.logger.debug("********************************** getDecodeEventDbData ********************************** crossChain not supported, hashX", hashX, " on Chain:", this.chainType, "crossChain: ", crossChain, "transactionHash is", decodeEvent.transactionHash);
            // return null;
          }

          let gasLimit = await this.getRelayGasLimit(decodeEvent.args.taskId);
          decodeEvent.gasLimit = gasLimit;

          content = {
            hashX: hashX,
            originChain: this.chainType,
            originChainID: this.chainID,
            crossChain: crossChain,
            crossChainID: crossChainID,
            crossScAddr: this.getDecodeEventCrossScAddr(decodeEvent),
            blockNumber: decodeEvent.blockNumber,
            timestamp: decodeEvent.timestamp * 1000,
            srcTransferEvent: decodeEvent
          };

          content.actionChain = content.crossChain;
          content.actionChainID = content.crossChainID;

          if ([this.relayEvent.src[0]].includes(eventName)) {
            content.crossMode = 'SINGLE';
            // encode js object into bytes string!
            content.extData = this.encodeFinalFunctionCallData(content.crossChain, decodeEvent.functionCallData);

            if (recordInDb.length === 0 || recordInDb[0].srcTransferEvent.length === 0) {
              this.logger.debug("********************************** r-1: found new message dispatch transaction ********************************** hashX", hashX, " on Chain:", this.chainType, " crossMode: ", content.crossMode, "transactionHash", decodeEvent.transactionHash);
            }

            let theCrossChain = getChain(crossChain);
            content.crossAddress = decodeEvent.args.contractAddress.toLowerCase();
            content.crossAddress = theCrossChain.parseAddress(content.crossAddress);
            let accountValid = await theCrossChain.isValidAddress(content.crossAddress);
            if (!accountValid) {
              this.logger.warn("getDecodeEventDbData error: crossAddress %s is not invalid, set isProxy true, message relay cross will fail!", content.crossAddress, 'hashX-', hashX);
              content.isProxy = true;
            }
          }
        } catch (err) {
          this.logger.error("some wrong happened during decode message crossTrans", this.chainType, decodeEvent, err);
          content = {
            isUnDecode: true,
            originChain: this.chainType,
            actionChain: this.chainType,
            actionChainID: this.chainID,
            unDecodeEvent: decodeEvent
          };

          this.logger.warn("********************************** 00: found unDecode message transaction ********************************** hashX", hashX, "transactionHash", decodeEvent.transactionHash, " on Chain:", this.chainType);
          return [hexAdd0x(hashX), content];
        }
      } else if (([].concat(this.relayEvent.dest)).includes(eventName) && (recordInDb.length === 0 || recordInDb[0].crossChain === this.chainType)) {
        if (recordInDb.length === 0 || recordInDb[0].destReceiveEvent.length === 0) {
          if ([this.relayEvent.dest[0]].includes(eventName)) {
            if (!recordInDb[0] || !recordInDb[0].crossMode) {
              content.crossMode = 'SINGLE';
            }

            this.logger.debug("********************************** r-3: found message cross relay transaction ********************************** hashX", hashX, " on Chain:", this.chainType, " crossMode: SINGLE", "transactionHash", decodeEvent.transactionHash);
          }
        }
        content = {
          destReceiveEvent: decodeEvent
        };
      }
      return [hashX, content];
    } catch (err) {
      this.logger.error("some wrong happened during getDecodeEventDbData", this.chainType, decodeEvent, err);
      return null;
    }
  }

  //   {
  //     chainType:
  //     uniqueId:
  //     dataHash:
  //     rawData: "..."
  //  }
  async decodeSignatureData(approveData) {
    try {
      let hashX = approveData.uniqueId;
      this.hashX = hashX;

      this.logger.debug("********************************** decodeSignatureData Via multiSig ********************************** hashX", hashX, JSON.stringify(approveData));

      let option = {
        hashX: hashX
      };
      let recordInDb = await global.modelOps.getEventHistory(option);

      if (recordInDb.length !== 0) {
        let crossAddress = recordInDb[0].crossAddress;

        this.logger.debug('decodeSignatureData found one approveData : chainType-', this.chainType, 'chainID-', this.chainID,
          'hashKey-', hashX, 'crossMode-', recordInDb[0].crossMode, 'crossAddress-', crossAddress);

        let encodedInfo = this.convertEncodeInfo(this.hashX, this.chainID, crossAddress, recordInDb[0].extData);
        const messageHash = ethUtil.keccak256(Buffer.from(encodedInfo, "hex"));
        let dataHash = hexAdd0x(messageHash.toString('hex'));

        if (hexAdd0x(dataHash) !== hexAdd0x(approveData.dataHash) || hexAdd0x(encodedInfo) !== hexAdd0x(approveData.rawData)) {
          this.logger.debug(`decodeSignatureData: chainType-, ${this.chainType}, get invalid approveData. hashX: ${hashX}, rawData ${hexAdd0x(encodedInfo)}, dataHash !== approveData.hashData, ${dataHash} !== ${approveData.dataHash}`);
          return null;
        } else {
          await this.internalSignViaMultiSig(encodedInfo);
          return true;
        }
      }
    } catch (err) {
      return await Promise.reject(err);
    }
  }

  async getRelayGasLimit(taskId) {
    // let scFunc = 'messageGasLimit';
    // return this.chain.callSolInterface(this.contractAbi, this.contractAddr, scFunc, taskId);
    //TODO:
    return 60000;
  }

  /**
   *  this is serve for MPC sign
   * @param address
   * @returns {*}
   */
  getPrivateKeyFromKeystore(address) { // this is EVM private key use for inner signing
    let password = agentUtils.getChainPassword(this.chainType);
    let privateKey = agentUtils.getPrivateKeyStr(password, address);
    return privateKey;
  }

  getPublicKeyFromKeystore() {  // this is EVM public key use
    let privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : this.getPrivateKeyFromKeystore(this.agentAddress);
    let publicKey = agentUtils.getPublicKeyFromPrivateKey(privateKey);
    return publicKey;
  }

  /**
   * Convert functionCallData which is a js object to encoding hex-string.
   *
   * @param crossChainType:   of the chain that this function's return value will be applied to.
   * @param functionCallData: js object to be encoded
   * @param messageType:  to-be-implemented. used as an index-key to pick up converter.
   * @returns {*}
   */
  encodeFinalFunctionCallData(crossChainType, functionCallData, messageType = "OrderCreate") {

    let convert = global.convertDict[crossChainType];
    let encodeFunctionCallDataResult = convert.encodeFunctionCallData(functionCallData.messageData);
    let finallyFunctionCallData = convert.encodeFinalFunctionCallData(functionCallData.networkId, functionCallData.contractAddress, encodeFunctionCallDataResult);
    return finallyFunctionCallData;

  }

  /**
   *  Decode hex-string format input into a js object.
   *
   * @param originChainType : of the chain that this 'finallyFunctionCallData' string came from.
   * @param finallyFunctionCallData: a hex-string format value.
   * @param messageType:  to-be-implemented. used as an index-key to pick up converter.
   * @returns {*}
   */
  decodeFinalFunctionCallData(originChainType, finallyFunctionCallData, messageType = "OrderCreate") {
    let convert = global.convertDict[originChainType];

    return convert.recursiveDecodeFinalFunctionCallData(finallyFunctionCallData)

    // let decodeFinalFunctionCallDataResult = convert.decodeFinalFunctionCallData(finallyFunctionCallData);
    // let convertResult = convert.decodeFunctionCallData(decodeFinalFunctionCallDataResult.functionCallData); // TODO: should use 'messageType' as well to pick up decoder that suit given message type.
    // return Object.assign({},decodeFinalFunctionCallDataResult, convertResult);;
  }

  /**
   *  Use ETH private key as seed of stellar keypair.
   * @returns {string|*}
   */
  getStellarEd25519Seed(){
    const passwd = agentUtils.getChainPassword(this.chainType);
    let seed = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : agentUtils.getPrivateKeyStr(passwd, this.agentAddress);
    return  seed;
  }

}

