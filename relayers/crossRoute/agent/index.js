/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const EthAgentModel = require("./EthAgentModel.js");
const StellarAgent = require("./StellarAgent")

function creatEthAgentFork(chainType) {
  class EthAgentModelTemp extends EthAgentModel {
    constructor(record = null) {
      super(record, chainType);
    }
  }
  return EthAgentModelTemp;
}

const agentDict = {
  MATIC: creatEthAgentFork('MATIC'),
  XLM: StellarAgent,
}

function getAgentByChain(chainType) {
  return agentDict[chainType];
}

exports.agentDict = agentDict;
exports.getAgentByChain = getAgentByChain;
exports.creatEthAgentFork = creatEthAgentFork;
