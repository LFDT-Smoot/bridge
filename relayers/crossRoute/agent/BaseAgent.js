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

let Contract = require("../contract/Contract.js");

const MultiSig = require('../multiSig/index.js')

global.convertDict = require('../convert/index.js').convertDict;

const { toBN, toWei, padLeft } = require('web3-utils');
const ethUtil = require('ethereumjs-util');

const Web3 = require("web3");
const web3 = new Web3();

module.exports = class BaseAgent {
  constructor(record = null, chainType = null, logger = global.syncLogger ? global.syncLogger : console) {
    this.logger = logger;
    this.config = global.config;
    this.chainType = chainType;
    this.chain = getChain(this.chainType.toUpperCase(), this.logger, this.config.crossTokens[chainType].CONF.nodeUrl);

    this.crossConf = this.config.crossTokens[this.chainType].CONF;
    this.crossTokens = this.config.crossTokens[this.chainType].TOKEN;

    this.chainID = this.crossConf.chainID;
    this.transChainID = this.crossConf.transChainID;

    if (process.env && process.env.PRIVATE_KEY) {
      let account = this.chain.getAccountFromPrivateKey(process.env.PRIVATE_KEY);
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

    this.contractAddr = this.crossInfo.CONTRACT.gatewayAddr ? this.crossInfo.CONTRACT.gatewayAddr.toLowerCase() : this.crossInfo.CONTRACT.gatewayAddr;
    let abi = this.crossInfo.CONTRACT.gatewayAbi;

    this.contractAbi = abi;
    this.contract = new Contract(abi, this.contractAddr);

    this.transChainNonceless = this.crossInfo ? this.crossInfo.CONF.nonceless : false;

    this.relayFunc = this.crossInfo.FUNCTION.Relay;
    this.relayEvent = this.crossInfo.EVENT.Relay;

    this.record = record;

    if (record !== null) {
      this.setRecord(record);
      this.relayFunc = this.crossInfo.FUNCTION.Relay.dest[0];
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
    this.crossAddress = (record.crossAddress) ? record.crossAddress.toLowerCase() : record.crossAddress;
  }

  setKey(key) {
    this.key = key;
  }
  setHashX(hashX) {
    this.hashX = hashX;
  }

  getChainPassword() {
    if (!global.secret) {
      global.secret = {};
    }
    return global.secret['WORKING_PWD'];
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

  getWeiFromGwei(gwei) {
    return toWei(gwei, 'gwei');
  }

  encodeValue(value, decimals) {
    return value;
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
        if (block && (block.baseFeePerGas !== undefined && !toBN(block.baseFeePerGas).eq(0)) && ((global.testnet && !this.crossConf.EIP1559Disabled) || (!global.testnet && this.crossConf.EIP1559Enabled))) {
          // this.logger.debug(`EIP-1559 is supported on chain chainType ${this.chainType}, baseFeePerGas : ${toBN(block.baseFeePerGas).toString(10)}, chainGasPrice : ${toBN(chainGasPrice).toString(10)}.`);
          gasPrice = this.generate_gas_price_EIP1559(block.baseFeePerGas, chainGasPrice);
        } else {
          if (this.crossConf.baseGasPrice) {
            gasPrice = this.getWeiFromGwei(toBN(this.crossConf.baseGasPrice));
          } else {
            // gasPrice = await this.chain.getGasPriceSync();
            gasPrice = toBN(chainGasPrice);
            let gasAddDelta = gasPrice.add(this.getWeiFromGwei(toBN(this.crossConf.gasPriceDelta)));
            if (this.crossConf.maxGasPrice) {
              let maxGasPrice = this.getWeiFromGwei(toBN(this.crossConf.maxGasPrice));
              gasPrice = Math.min(maxGasPrice, gasAddDelta);
            }
          }
        }
        resolve(gasPrice);
      } catch (err) {
        this.logger.error("getGasPrice failed", err);
        reject(err);
      }
    });
  }

  generate_gas_price_EIP1559(baseFeePerGas, chainGasPrice) {
    let maxBaseFeeMultiplier = this.crossConf.BaseFeeMultiplier ? this.crossConf.BaseFeeMultiplier : 2;
    let numerator = this.crossConf.gasNumerator ? this.crossConf.gasNumerator : 50;
    let denominator = this.crossConf.gasDenominator ? this.crossConf.gasDenominator : 10000;

    this.logger.debug(`EIP-1559 generate_gas_price_EIP1559 on chain chainType ${this.chainType} hashX ${this.hashX}, baseFeePerGas : ${toBN(baseFeePerGas).toString(10)}, chainGasPrice : ${toBN(chainGasPrice).toString(10)},
    while config maxBaseFeeMultiplier ${maxBaseFeeMultiplier} numerator ${numerator} denominator ${denominator} crossConf.maxPriorityFeePerGas ${this.crossConf.maxPriorityFeePerGas} crossConf.maxFeePerGas ${this.crossConf.maxFeePerGas} crossConf.maxGasPrice ${this.crossConf.maxGasPrice}.`);

    // let maxPriorityFeePerGas = this.crossConf.maxPriorityFeePerGas ?
    //   toBN(this.crossConf.maxPriorityFeePerGas) :
    //   this.calcGas(baseFeePerGas, numerator, denominator);

    let maxPriorityFeePerGas;
    if (this.crossConf.maxPriorityFeePerGas) {
      maxPriorityFeePerGas = toBN(this.crossConf.maxPriorityFeePerGas);
    } else {
      maxPriorityFeePerGas = this.calcGas(baseFeePerGas, numerator, denominator);
      maxPriorityFeePerGas = Math.max(maxPriorityFeePerGas, toBN(chainGasPrice).sub(toBN(baseFeePerGas)));
    }

    if (this.crossConf.minMaxPriorityFeePerGas && toBN(this.crossConf.minMaxPriorityFeePerGas).gt(maxPriorityFeePerGas)) {
      maxPriorityFeePerGas = toBN(this.crossConf.minMaxPriorityFeePerGas);
    }
    let maxFeePerGas = this.crossConf.maxFeePerGas ?
      toBN(this.crossConf.maxFeePerGas) :
      toBN(baseFeePerGas).mul(toBN(maxBaseFeeMultiplier)).add(toBN(maxPriorityFeePerGas));

    if (this.crossConf.maxGasPrice) {
      let maxGasPrice = this.getWeiFromGwei(toBN(this.crossConf.maxGasPrice));
      maxFeePerGas = Math.min(maxGasPrice, maxFeePerGas);
    }
    // incase maxFeePerGas be limited by maxGasPrice
    maxPriorityFeePerGas = Math.min(maxFeePerGas, maxPriorityFeePerGas);
    return {
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas
    }
  }

  // gasPrice in wei
  calcGas(gasPrice, numerator, denominator) {
    let newGasPrice = toBN(gasPrice).mul(toBN(numerator)).div(toBN(denominator));
    if (toBN(newGasPrice).eq(0) || toBN(newGasPrice).cmp(toBN(gasPrice).mul(toBN(numerator)).div(toBN(denominator))) < 0) {
      // in case gasPrice too small, plus 1 wei
      newGasPrice = toBN(newGasPrice).add(toBN(1));
    }
    return newGasPrice;
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
        let password = this.getChainPassword();
        let rawTx = this.trans.signFromKeystore(password);
        resolve(rawTx);
      } catch (err) {
        this.logger.error("********************************** signTrans failed ********************************** hashX", this.hashX);
        reject(err);
      }
    });
  }

  generateTransData(crossFunc, ...params) {
    return this.contract.constructData(crossFunc, ...params);
  }

  encode(typesArray, signData) {
    this.logger.debug("********************************** encode signData **********************************", signData, "hashX:", this.hashX);

    return hexAdd0x(web3.eth.abi.encodeParameters(typesArray, signData));
  }

  decode(typesArray, signData) {
    this.logger.debug("********************************** decode signData **********************************", signData, "hashX:", this.hashX);

    return web3.eth.abi.decodeParameters(typesArray, signData);
  }

  convertToTupleType(input) {
    const isObjectArray = Array.isArray(input) && typeof input[0] === 'object';

    const components = input.map((item, index) => {
      if (isObjectArray) {
        return {
          type: item.type,
          name: item.name
        };
      } else {
        return {
          type: item
        };
      }
    });

    return {
      type: 'tuple',
      components: components
    };
  }

  encodeTuple(typesArray, signData) {
    const tupleType = this.convertToTupleType(typesArray);
    this.logger.debug("********************************** encodeTuple signData **********************************", tupleType, signData, "hashX:", this.hashX);

    return hexAdd0x(web3.eth.abi.encodeParameter(tupleType, signData));
  }

  decodeTuple(typesArray, signData) {
    const tupleType = this.convertToTupleType(typesArray);
    this.logger.debug("********************************** decode signData **********************************", tupleType, signData, "hashX:", this.hashX);

    return web3.eth.abi.decodeParameter(tupleType, signData);
  }

  convertEncodeInfo(taskId, networkId, contractAddress, functionCallData) {
    let signData = [];
    let typesArray = [];
    signData = [taskId, networkId, contractAddress, functionCallData];
    typesArray = ['bytes32', 'uint256', 'address', 'bytes'];

    let encodedInfo = this.encodeTuple(typesArray, signData);
    return encodedInfo;
  }

  decodeEncodeInfo(encodedInfo) {
    let typesArray = [];
    typesArray = [      {
      "indexed": true,
      "internalType": "bytes32",
      "name": "taskId",
      "type": "bytes32"
    },
    {
      "indexed": true,
      "internalType": "uint256",
      "name": "networkId",
      "type": "uint256"
    },
    {
      "indexed": false,
      "internalType": "address",
      "name": "contractAddress",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "bytes",
      "name": "functionCallData",
      "type": "bytes"
    }];
    typesArray = ['bytes32', 'uint256', 'address', 'bytes'];

    let result = this.decodeTuple(typesArray, encodedInfo);
    return result;
  }

  convertSignatures(signatures) {
    return signatures.map((sig) => {
      const address = this.chain.publicKeyToAddress(sig.pk);

      const by = toBN(address);
      const signature = ethUtil.fromRpcSig(hexAdd0x(sig.signature));

      let convertSig = {
        by: by.toString(10), // uint256 by
        sigR: hexAdd0x(signature.r.toString('hex')), // uint256 sigR
        sigS: hexAdd0x(signature.s.toString('hex')), // uint256 sigS
        sigV: signature.v, // uint256 sigV
        meta: '0x' + '0'.repeat(64) // bytes32 meta, set 0x0000...
      };
      this.logger.debug("convertSig result is", convertSig);
      return [convertSig.by, convertSig.sigR, convertSig.sigS, convertSig.sigV, convertSig.meta]
    });
  }

  convertEncodeProof(signatures) {
    let encodedProof;
    let typ = '0';
    let proofData = '0x0000';
    let encodedProofData = [typ, proofData, signatures];
    let encodedProofTypesArray = ['uint256', 'bytes', 'tuple(uint256 by, uint256 sigR, uint256 sigS, uint256 sigV, bytes32 meta)[]'];
    encodedProof = this.encode(encodedProofTypesArray, encodedProofData);

    return encodedProof;
  }

  async getRelayTaskData() {
    this.logger.debug("********************************** funcInterface **********************************", this.relayFunc, "hashX", this.hashX);
    this.logger.debug('getRelayTaskData: chainType-', this.chainType, 'chainID-', this.chainID, 'hashX-', this.hashX, 'crossAddress-', this.crossAddress, 'message gasLimit', this.record.srcTransferEvent[0].gasLimit);

    if (this.multiSignature) {

      let params = [];
      let encodedInfo = this.convertEncodeInfo(this.hashX, this.chainID, this.crossAddress, this.record.extData);

      let internalSignature = await this.internalSignViaMultiSig(encodedInfo);

      if (this.isLeader) {
        let signatures = this.convertSignatures(internalSignature);
        let encodedProof = this.convertEncodeProof(signatures);

        params = [this.chainID, encodedInfo, encodedProof];
        this.logger.debug("********************************** funcInterface constructData **********************************", this.relayFunc, params, "hashX", this.hashX);

        return this.generateTransData(this.relayFunc, ...params);
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
    content['isUpdateAction'] = false;
    return content;
  }

  async prepareSignData(encodedInfo) {
    const messageHash = ethUtil.keccak256(encodedInfo);
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
        this.logger.info("********************************** internalSignViaMultiSig ********************************** hashX", this.hashX, encodedInfo);

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

  getDecodeEventValue(decodeEvent) {
    return decodeEvent.args.value ? decodeEvent.args.value.toString(10) : decodeEvent.args.value;
  }

  encodeFinalFunctionCallData(crossChainType, functionCallData) {
    let convert = global.convertDict[crossChainType];
    convert.setConvertContract({}, functionCallData.method);
    let encodeFunctionCallDataResult = convert.encodeFunctionCallData(functionCallData.messageData);
    let finallyFunctionCallData = convert.encodeFinalFunctionCallData(functionCallData.networkId, functionCallData.contractAddress, encodeFunctionCallDataResult);
    return finallyFunctionCallData;
  }

  decodeFinalFunctionCallData(originChainType, finallyFunctionCallData) {
    let convert = global.convertDict[originChainType];
    let decodeFinalFunctionCallDataResult = convert.decodeFinalFunctionCallData(finallyFunctionCallData);
    let convertResult = convert.decodeFunctionCallData(decodeFinalFunctionCallDataResult.functionCallData);
    console.log("convertResult is", convertResult);
    return Object.assign({},decodeFinalFunctionCallDataResult, convertResult);;
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
      if (args.functionCallData) {
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
        let crossAddress = recordInDb[0].crossAddress.toLowerCase();

        this.logger.debug('decodeSignatureData found one approveData : chainType-', this.chainType, 'chainID-', this.chainID,
          'hashKey-', hashX, 'crossMode-', recordInDb[0].crossMode, 'crossAddress-', crossAddress);

        let encodedInfo = this.convertEncodeInfo(this.hashX, this.chainID, crossAddress, recordInDb[0].extData);
        const messageHash = ethUtil.keccak256(encodedInfo);
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
    let scFunc = 'messageGasLimit';
    return this.chain.callSolInterface(this.contractAbi, this.contractAddr, scFunc, taskId);
  }

  getPrivateKeyFromKeystore(address) {
    let tempTrans = new this.RawTrans();
    let password = this.getChainPassword();
    let privateKey = tempTrans.getPrivateKey(password, address);
    return privateKey;
  }

  getPublicKeyFromKeystore() {
    let privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : this.getPrivateKeyFromKeystore(this.agentAddress);

    let publicKey = this.chain.getPublicKeyFromPrivateKey(privateKey);
    return publicKey;
  }
}

