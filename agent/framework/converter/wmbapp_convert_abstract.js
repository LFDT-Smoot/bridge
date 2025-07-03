/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

let defaultFunc = 'wmbReceive';

module.exports = class WmbAppConvertAbstract{
  constructor(chainType = null, log = console) {
    this.logger = log;
    this.chainType = chainType;
  }

  setConvertContract(funcName) {
    this.func = funcName ? funcName : defaultFunc;
  }

  encodeFunctionCallData(messageData) {
    throw new Error("NOT IMPLEMENTED");
  }

  decodeFunctionCallData(functionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }

}