/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const eventSchema = new Schema({
  hashX: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  actionChain: {
    type: String
  },
  actionChainID: {
    type: Number
  },
  originChain: {
    type: String
  },
  originChainID: {
    type: Number
  },
  crossChain: {
    type: String
  },
  crossChainID: {
    type: Number
  },
  failAction: {
    type: String
  },
  failReason: {
    type: String
  },
  from: {
    type: String,
    // lowercase: true
  },
  crossScAddr: {
    type: String,
    // lowercase: true
  },
  crossAddress: {
    type: String,
    // lowercase: true
  },
  value: {
    type: String,
  },
  status: {
    type: String,
    default: 'init'
    /*
    waitingDestReceive, 
    waitingDestReceiveConfirming,
    redeemFinished,
    transFailed
    */
  },
  blockNumber: {
    type: Number
  },
  timestamp: {
    type: Number,
    default: 0
  },
  transRetried: {
    type: Number,
    default: 0
  },
  transConfirmed: {
    type: Number,
    default: 0
  },
  srcTransferEvent: {
    type: Array,
    default: []
  },
  destReceiveTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  destReceiveTxBlockNumber: {
    type: Array,
    default: []
  },
  destReceiveEvent: {
    type: Array,
    default: []
  },
  networkFee: {
    type: String
  },
  crossValue: {
    type: String
  },
  actionTime: {
    type: Number,
    default: 0
  },
  isUnDecode: {
    type: Boolean, /*false: normal cross trans, true: wanBridge unDecode trans*/
    default: false
  },
  unDecodeEvent: {
    type: Array,
    default: []
  },
  isUnDecodeDone: {
    type: Boolean,
    default: false
  },
  isUpdateAction: {
    type: Boolean,
    default: false
  },
  crossMode: {
    type: String,
  },
  extData: {
    type: String,
  },
}, {
  collection: 'event'
});

module.exports = eventSchema;