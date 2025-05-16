/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
if (!global.moduleConfig) {
  global.moduleConfig = require('../conf/moduleConfig.js');
}


const BigNumber = require('bignumber.js');


class abstract_base_chain {
  constructor(log, nodeUrl, chainType = null) {
    this.log = log ? log : console;
    this.nodeUrl = nodeUrl;
    if (chainType) {
      this.chainType = chainType;
    } else {
      this.setChainType();
    }
    this.getConfig();
    this.client = this.getClient(nodeUrl);
  }

  setChainType() {
  }

  getConfig() {
    let chainConf = global.moduleConfig.crossInfoDict[this.chainType];
    let getProperty = (_chainConf, _moduleConfig, propertyName) => {
      _chainConf = _chainConf ? _chainConf.CONF : null;
      let val = _chainConf ? _chainConf[propertyName] : null
      return (val | val === 0) ? val : _moduleConfig[propertyName]
    }
    this.matchAllScAddressPerScan = getProperty(chainConf, global.moduleConfig, 'matchAllScAddressPerScan');

    this.safe_block_num = getProperty(chainConf, global.moduleConfig, 'SAFE_BLOCK_NUM');
    this.confirm_block_num = getProperty(chainConf, global.moduleConfig, 'CONFIRM_BLOCK_NUM');

    this.trace_block_num = getProperty(chainConf, global.moduleConfig, 'TRACE_BLOCK_NUM');
    this.sync_interval_block_num = getProperty(chainConf, global.moduleConfig, 'SYNC_INTERVAL_BLOCK_NUM');
    this.sync_interval_time = getProperty(chainConf, global.moduleConfig, 'SYNC_INTERVAL_TIME');

    this.nonceless = getProperty(chainConf, global.moduleConfig, 'nonceless');
  }

  getChainPassword() {
    return global.secret['WORKING_PWD'];
  }

  toBigNumber(n) {
    n = n || 0;

    if (typeof n === 'string' && (n.indexOf('0x') === 0 || n.indexOf('-0x') === 0)) {
      return new BigNumber(n.replace('0x', ''), 16);
    }

    return new BigNumber(n.toString(10), 10);
  }

  tokenToWei(token, decimals = 18) {
    let wei = this.toBigNumber(token).times('1e' + decimals).trunc();
    return wei.toString(10);
  }

  weiToToken(tokenWei, decimals = 18) {
    return this.toBigNumber(tokenWei).dividedBy('1e' + decimals).toString(10);
  }

  bigNumber2String(json, num) {
    for (let i in json) {
      if (json[i].constructor.name === 'BigNumber') {
        json[i] = json[i].toString(num);
      }
    }
  }

  getGasPriceSync() {
    return null;
  }

  getNonceSync(address) {
    return null;
  }

  getNonceIncludePendingSync(address) {
    return null;
  }

  getClient(nodeUrl) {
    throw new Error("NOT IMPLEMENTED");
  }

  getScEventSync(address, topics, fromBlk = 0, toBlk = 'latest') {
    throw new Error("NOT IMPLEMENTED");
  }

  getBlockNumberSync() {
    throw new Error("NOT IMPLEMENTED");
  }

  sendRawTransaction(signedTx, callback) {
    throw new Error("NOT IMPLEMENTED");
  }

  sendRawTransactionSync(signedTx, retryTimes = 3) {
    throw new Error("NOT IMPLEMENTED");
  }

  getTxInfo(txHash, callback) {
    throw new Error("NOT IMPLEMENTED");
  }

  getBlockByNumber(blockNumber, callback) {
    throw new Error("NOT IMPLEMENTED");
  }

  getBlockByNumberSync(blockNumber) {
    throw new Error("NOT IMPLEMENTED");
  }

  getTransactionConfirmSync(txHash, waitBlocks, block_num) {
    throw new Error("NOT IMPLEMENTED");
  }

  getTransactionReceipt(txHash, callback) {
    throw new Error("NOT IMPLEMENTED");
  }

  getTransactionReceiptSync(txHash) {
    throw new Error("NOT IMPLEMENTED");
  }

  async isValidAddress(address) {
    throw new Error("NOT IMPLEMENTED");
  }

  getTokenInfo(tokenScAddr, tokenCrossType) {
    throw new Error("NOT IMPLEMENTED");
  }

  encodeTopic(type, param) {
    throw new Error("NOT IMPLEMENTED");
  }
}

module.exports = abstract_base_chain;
