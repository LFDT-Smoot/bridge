/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

module.exports = class WmbGate_AbstractConvert{
  constructor(chainType = null, log = console) {
    this.logger = log;
    this.chainType = chainType;
  }

  encodeFinalFunctionCallData(networkId, contractAddress, functionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }

  decodeFinalFunctionCallData(finallyFunctionCallData) {
    throw new Error("NOT IMPLEMENTED");
  }

  getEncodeInfo(taskId, networkId, contractAddr, finalFunctionCallDataBytes) {
    throw new Error("NOT IMPLEMENTED");
  }

  getEncodeProof(signatures) {
    throw new Error("NOT IMPLEMENTED");
  }
}