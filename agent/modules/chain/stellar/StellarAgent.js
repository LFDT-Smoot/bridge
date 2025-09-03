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
} = require('@framework/comm/lib.js');

if (!global.moduleConfig) {
  global.moduleConfig = require('@framework/config/moduleConfig.js');
}

const { toBN, toWei, padLeft } = require('web3-utils');
const ethUtil = require('ethereumjs-util');

let stellarRawTransModel = require("./StellarRawTransModel.js");

const txBuilder = require("./utils/tx_builder.js");

const agentUtils = require("@framework/comm/utils.js");
const context = require('@framework/context');

const { toBigNumber } = require("@framework/comm/lib.js");

const StellarWallet = require('@modules/wallet/stellar_wallet.js');
const abstract_base_agent = require("@framework/chain/agent_abstract");

const StellarChain = require("./stellar.js");
const EthWallet = require("@modules/wallet/eth_wallet");


module.exports = class StellarAgent extends abstract_base_agent{
  constructor(record = null, chainType = "XLM", logger = global.syncLogger ? global.syncLogger : console) {
    super(record, chainType, logger);

    this.logger = logger;
    this.config = global.config;
    this.chainType = chainType;

    this.chain = new StellarChain(logger, this.config.crossTokens[chainType].CONF.nodeUrl, chainType);

    this.crossConf = this.config.crossTokens[this.chainType].CONF;
    this.crossTokens = this.config.crossTokens[this.chainType].TOKEN;

    this.chainID = this.crossConf.chainID;
    this.transChainID = this.crossConf.transChainID;

    const privateKey = context.getPrivateKey('agentWorker');

    const ethWallet = EthWallet.fromPrivate(privateKey);
    const walletAddress = ethWallet.address();
    console.log("this.ethWallet address: ", walletAddress);
    this.agentAddress = walletAddress;

    this.agentWorkerWallet = StellarWallet.fromPrivate(privateKey);

    if (!global.privateKey) {
      global.privateKey = {}
    }
    global.privateKey[this.agentAddress] = Buffer.from(hexTrip0x(privateKey), 'hex');

    this.isLeader = global.isLeader ? true : false
    // this.multiSignature = global.moduleConfig.multiSignature;

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

  async getDataForRelayProof() {
    const srcEvent = this.record.srcTransferEvent[0];
    const finalFunctionCallDataBytes = this.encodeFinalFunctionCallData(this.chainType, srcEvent.args.contractAddress, JSON.parse(this.record.extData))
    const encodedInfoStr = this.convertEncodeInfo(this.hashX, this.chainID, this.crossAddress, finalFunctionCallDataBytes);
    const encodedInfo = Buffer.from(encodedInfoStr, "hex");
    let signData = ethUtil.keccak256(encodedInfo);
    this.logger.info("********************************** prepareSignData Via MultiSig ********************************** hashX", this.hashX, signData, encodedInfoStr);

    const extData = { encodedInfo, chainType: this.chainType };
    return { id: this.hashX, signData, extData };
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
        this.logger.error("chain:", this.chainType, " createTrans failed, hashX", this.hashX, err);
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
        let seed = await this.agentWorkerWallet.privateKey();
        rawTx = this.trans.sign(seed);

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

  // async signMessage(messageHash) {
  //   let self = this;
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       let privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : self.getPrivateKeyFromKeystore(this.agentAddress);
  //       let privateKeyBuffer = Buffer.from(hexTrip0x(privateKey), 'hex');

  //       const signature = ethUtil.ecsign(messageHash, privateKeyBuffer);

  //       const combinedSignature = ethUtil.toRpcSig(signature.v, signature.r, signature.s);
  //       this.logger.debug('signMessage messageHash %s signature result is %s, hashX %s', messageHash.toString('hex'), combinedSignature, this.hashX);

  //       let signResult = {
  //         sigR: hexAdd0x(signature.r.toString('hex')),
  //         sigS: hexAdd0x(signature.s.toString('hex')),
  //         sigV: signature.v,
  //         signature: combinedSignature
  //       }
  //       resolve(signResult);
  //     } catch (err) {
  //       this.logger.error("********************************** signMessage failed ********************************** hashX", this.hashX);
  //       reject(err);
  //     }
  //   });
  // }

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
   * @param functionCallDataXdrBytes  is an encoded result for function-call-data js object.
   * @returns {*}  String type value.
   */
  convertEncodeInfo(taskId, networkId, contractAddress, functionCallDataXdrBytes) { // this is the gateway encoding helper.
    const gateConverter = global.wmbConverterMgr.getWmbGateConverter(this.chainType);
    return gateConverter.getEncodeInfo(taskId, networkId, contractAddress, functionCallDataXdrBytes);
  }

  // virtual function:
  /**
   *
   * @param signatures a list of signatures
   * @returns {*}  String type value.
   */
  convertEncodeProof(signatures) {
    const gateConverter = global.wmbConverterMgr.getWmbGateConverter(this.chainType);
    signatures = this._convertSignatures(signatures); // convert to stellar format.
    return gateConverter.getEncodeProof(signatures);
  }

  /**
   * Convert {r,s,v} format signatures to the required input format of getEncodeProof() in stellar converter
   * @param signatures
   * @returns {*}
   */
  _convertSignatures(signatures) {
    // input is array of [by, r, s, v, meta]
    return signatures.map(sig => {
      const _signature = hexTrip0x(sig[1]) + hexTrip0x(sig[2]);
      const sig_buf = Buffer.from(_signature, "hex");
      const uint8Array = new Uint8Array(sig_buf);
      return {
        signature: uint8Array,
        recid: sig[3] - 27
      }
    })
  }


  async getRelayTaskData() {
    const srcEvent = this.record.srcTransferEvent[0];
    this.logger.debug("********************************** funcInterface **********************************", this.relayFunc, "hashX", this.hashX);
    this.logger.debug('getRelayTaskData: chainType-', this.chainType, 'chainID-', this.chainID, 'hashX-', this.hashX, 'crossAddress-', this.crossAddress, 'message gasLimit', srcEvent.gasLimit);

    const msgBridgeContractAddress = this.contractAddr;

    //Note: `this.record.extData` is an encoded-final-function-call-data that persistent into DB.
    // extData is JSON-string of {networkId:xx, contractAddress:xx, functionCallData:xx} ！ --It is business/WmbApp level data.

    // args.contractAddress ； is the wmb-app contract address on peer chain

    if (this.isLeader) {

      let functionCallDataBytes = this.encodeFinalFunctionCallData(this.chainType, srcEvent.args.contractAddress, JSON.parse(this.record.extData))
      let encodedInfo = this.convertEncodeInfo(this.hashX, this.chainID, this.crossAddress, functionCallDataBytes);

      /* Note：this.proof was set by setProof() with the return value of multiSig.signByApprove(), it format is:
        [
          {
            "pk": "046ef704ec6aabaab156abe9eec3581667ccdcef2794312a70f1f8180181b67a114704052adf3b21af01f5e84114f7234c2f798215e04d15ad226f799c51677e92",
            "signature": "0xec0259de1ab370db7a8d40665e37b3b08bb017b94701d60df69bf0800eb2c49d28818ca6227bc5fd767940bf027a83f6fb79b2f61265f3f43e4aedf47915fef31b",
            "timestamp": 1751279074990
          }
        ]
      */
      let signatures = agentUtils.convertSignatures(this.proof);
      let encodedProof = this.convertEncodeProof(signatures);
      let params = [];
      params = [this.chainID, encodedInfo, encodedProof];
      this.logger.debug("********************************** funcInterface constructData **********************************", this.relayFunc, params, "hashX", this.hashX);

      const pubKey = this.agentWorkerWallet.publicKey();
      const preparedTransaction = await txBuilder.inBoundCallTxBuilder(msgBridgeContractAddress, pubKey, {
        chainID: this.chainID,
        encodedInfo: Buffer.from(encodedInfo, "hex"),
        encodedProof: Buffer.from(encodedProof, "hex")
      })

      return preparedTransaction;
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

  // async prepareSignData(encodedInfo) {
  //   const messageHash = ethUtil.keccak256(Buffer.from(encodedInfo, "hex"));
  //   let signature = await this.signMessage(messageHash)

  //   let pk = global.tokenList[this.chainType].pk;
  //   let signDataObj = {
  //     "uniqueId": this.hashX,
  //     "dataHash": messageHash.toString('hex'),
  //     "pk": hexTrip0x(pk),
  //     "signature": signature,
  //     "rawData": encodedInfo
  //   }

  //   return signDataObj;
  // }

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
      // args.functionCallData is the WmbApp level data, in bytes/hex mode. It's decoded object is of format: { chainID: xx, scAddress: xx, functionCallData: {messageFunc: 'wmbReceive', messageData: data} }
      if (args.functionCallData) {
        // Note: decodeEvent.address --- is the wmb-gate contract address ，It was assigned inside getScEventSync()
        // Note: args.contractAddress the peer-chain's WmbApp contract
        decodeEvent.functionCallData = this.decodeFinalFunctionCallData(this.chainType, args.contractAddress, args.functionCallData);
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
            if(decodeEvent.functionCallData) {
              content.extData = JSON.stringify(decodeEvent.functionCallData);
            }

            if (recordInDb.length === 0 || recordInDb[0].srcTransferEvent.length === 0) {
              this.logger.debug("********************************** r-1: found new message dispatch transaction ********************************** hashX", hashX, " on Chain:", this.chainType, " crossMode: ", content.crossMode, "transactionHash", decodeEvent.transactionHash);
            }

            let theCrossChain = context.getChain(crossChain);
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
      throw err;
    }
  }


  async checkRelayData(id, signData, extData) {
    try {

      this.logger.debug("********************************** checkRelayData Via multiSig ********************************** hashX", this.hashX, JSON.stringify({ id, signData, extData }));

      let crossAddress = this.crossAddress.toLowerCase();

      this.logger.debug('checkRelayData found one approveData : chainType-', this.chainType, 'chainID-', this.chainID,
        'hashKey-', this.hashX, 'crossMode-', this.record.crossMode, 'crossAddress-', crossAddress);

      const proofData = await this.getDataForRelayProof();
      return (proofData.signData.toString("hex").toLowerCase() === id.dataHash);
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

  // /**
  //  *  this is serve for MPC sign
  //  * @param address
  //  * @returns {*}
  //  */
  // getPrivateKeyFromKeystore(address) { // this is EVM private key use for inner signing
  //   let password = agentUtils.getChainPassword(this.chainType);
  //   let privateKey = agentUtils.getPrivateKeyStr(password, address);
  //   return privateKey;
  // }

  // getPublicKeyFromKeystore() {  // this is EVM public key use
  //   // let privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : this.getPrivateKeyFromKeystore(this.agentAddress);
  //   // let publicKey = agentUtils.getPublicKeyFromPrivateKey(privateKey);
  //   // return publicKey;
  // }

  /**
   * Convert functionCallData which is a js object to encoding hex-string.
   *
   * @param crossChainType   of the chain that this function's return value will be applied to.
   * @param wmbAppScAddress  The address of WmbApp busyness contract.
   * @param functionCallData js object to be encoded
   * @returns {*}
   */
  encodeFinalFunctionCallData(crossChainType, wmbAppScAddress, functionCallData) {

    const gateConverter = global.wmbConverterMgr.getWmbGateConverter(crossChainType);
    const wmbAppConverter = global.wmbConverterMgr.getWmbAppConverterByScAddress(crossChainType, wmbAppScAddress);
    if (!wmbAppConverter){
      throw new Error("Failed to decode final function. Because can not find matched converter.");
    }

    let encodeFunctionCallDataResult = wmbAppConverter.encodeFunctionCallData(functionCallData.messageData); // return the encode result for {messageFunc: 'wmbReceive', messageData: data} ！
    let finallyFunctionCallData = gateConverter.encodeFinalFunctionCallData(functionCallData.networkId, functionCallData.contractAddress, encodeFunctionCallDataResult);
    return finallyFunctionCallData;
  }

  /**
   *  Decode hex-string format input into a js object.
   *
   * @param originChainType  of the chain that this 'finallyFunctionCallData' string came from.
   * @param wmbAppScAddress  The address of WmbApp busyness contract.
   * @param finalFuncCallDataXdrBytes a hex-string format value.
   * @returns {*} return the JSON object
   */
  decodeFinalFunctionCallData(originChainType, wmbAppScAddress, finalFuncCallDataXdrBytes) {

    const gateConverter = global.wmbConverterMgr.getWmbGateConverter(originChainType);
    let finalFuncCallDataObj = gateConverter.decodeFinalFunctionCallData(finalFuncCallDataXdrBytes); // return: {chainId: xx, contractAddress:xx, functionCallData: xx}

    const wmbAppConverter = global.wmbConverterMgr.getWmbAppConverterByScAddress(originChainType, wmbAppScAddress);
    if (!wmbAppConverter){
      throw new Error("Failed to decode final function. Because can not find matched converter.");
    }
    let funcCallDataObj = wmbAppConverter.decodeFunctionCallData(finalFuncCallDataObj.functionCallData);

    return {
      "contractAddress": finalFuncCallDataObj.contractAddress, // original chain address
      "networkId": toBigNumber(finalFuncCallDataObj.networkId).toFixed(),   // original chain address
      "method": funcCallDataObj.messageFunc,
      "messageData": funcCallDataObj.messageData,
    }
  }


  async getCrossMessageTask(fromBlock, toBlock) {
    const events = await this.chain.getScEventSync(this.contractAddr, [], fromBlock, toBlock);
    let multiEvents = [...events].map((event) => {
      return new Promise(async (resolve, reject) => {
        try {
          let decodeEvent;

          if (this.contract) {
            decodeEvent = this.contract.parseEvent(event);
          } else {
            decodeEvent = event;
          }

          let content;
          if (decodeEvent === null || decodeEvent === undefined) {
            resolve();
            return;
          } else {
            content = await this.getDecodeEventDbData(decodeEvent);
            resolve(content);
          }

        } catch (err) {
          reject(err);
        }
      });
    });

    let contents = [];
    const ret = await Promise.all(multiEvents);
    for (let i = 0; i < ret.length; i++) {
      if (ret[i]) {
        contents.push(ret[i]);
      }
    }
    return contents;
  }

  async getBlockNumberSync() {
    return this.chain.getBlockNumberSync();
  }

  async getTransactionConfirmSync(txHash, confirm_block_num) {
    return this.chain.getTransactionConfirmSync(txHash, confirm_block_num);
  }

}

