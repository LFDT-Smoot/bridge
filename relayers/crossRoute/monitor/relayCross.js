/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
const StateAction = require("../monitor/stateAction.js");

/* action: [functionName, paras, nextState, rollState] */
var stateDict = {
  init: {
    action: 'checkBridgeType',
    paras: ['waitingDestReceive', 'transIgnored']
  },
  waitingDestReceive: {
    action: 'sendTrans',
    paras: ['relayTask', 'destReceiveEvent', ['waitingDestReceiveConfirming', 'redeemFinished'],
      ['waitingDestReceive', 'transFailed']
    ]
  },
  waitingDestReceiveConfirming: {
    action: 'checkTransOnline',
    paras: ['destReceiveEvent', 'destReceiveTxHash', 'redeemFinished', ['init', 'transFailed']]
  },
  redeemFinished: {},

  // exception handling
  waitingIntervention: {},
  transFailed: {
    action: 'takeIntervention',
    paras: ['waitingIntervention', 'transFailed']
  },
  transIgnored: {},
  interventionPending: {
    action: 'checkBridgeType',
    paras: ['waitingDestReceive', 'transIgnored']
  }
};

module.exports = class Relay extends StateAction{
  constructor(record, logger) {
    super(record, logger);

    this.stateDict = stateDict;

    this.logger.debug("********************************** Relay StateAction ********************************** hashX:", this.hashX, "status:", this.state);
  }

  async checkBridgeType(actionState, ignoreState) {
    let content = {};
    if (global.moduleConfig.crossInfoDict[this.record.actionChain].CONTRACT.gatewayAddr) {
      content = {
        status: actionState
      };
    } else {
      content = {
        status: ignoreState
      };
    }
    await this.updateRecord(content);
  }

  async takeIntervention(nextState, rollState) {
    super.takeIntervention(nextState, rollState);
  }

  async checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

    try {
      if (!this.record.srcTransferEvent || this.record.srcTransferEvent.length === 0) {
        return false;
      }

      if (!global.isLeader && this.record.srcTransferEvent && this.record.srcTransferEvent.length !== 0
        && this.record.destReceiveEvent && this.record.destReceiveEvent.length !== 0) {
        await this.updateState('redeemFinished');
        return true;
      }

      if (state === "waitingIntervention" || state === "interventionPending" || state === "transFailed") {
        return false;
      }
      return false;
    } catch (err) {
      this.logger.error("checkHashTimeout:", err);
    }
  }
}
