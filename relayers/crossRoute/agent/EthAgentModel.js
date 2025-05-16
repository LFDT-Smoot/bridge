/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const BaseAgent = require("./BaseAgent.js");
let ethRawTransModel = require("../trans/EthRawTransModel.js");

module.exports = class EthAgentModel extends BaseAgent{
  constructor(record = null, chainType = null, logger = global.syncLogger ? global.syncLogger : console) {
    super(record, chainType, logger);
    this.RawTrans = ethRawTransModel;
  }

  getChainType() {
    return this.chainType;
  }
}