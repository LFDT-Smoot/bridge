/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

let defaultAbi = require('../abi/nftMarket.abi.json');
let defaultFunc = 'wmbReceive';

module.exports = class AbstractConvert{
  constructor(chainType = null, log = console) {
    this.logger = log;
    this.chainType = chainType;
  }

  setConvertContract(abi, action) {
    this.abi = abi ? abi : defaultAbi;
    this.func = action ? action : defaultFunc;
  }

  getMessageAbi() {
    throw new Error("NOT IMPLEMENTED");
  }

  encodeMessageData(...encodeMessage) {
    throw new Error("NOT IMPLEMENTED");
  }

  decodeMessageData(messageData) {
    throw new Error("NOT IMPLEMENTED");
  }

  encodeFunctionCallData(messageData) {
    throw new Error("NOT IMPLEMENTED");
  }

  decodeFunctionCallData(functionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }

  encodeFinalFunctionCallData(networkId, contractAddress, functionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }

  decodeFinalFunctionCallData(finallyFunctionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }
}