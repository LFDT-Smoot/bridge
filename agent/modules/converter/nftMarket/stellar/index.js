/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const { xdr, scValToNative, ScInt} = require("@stellar/stellar-sdk");

const WmbAppConvertAbstract = require("@framework/converter/wmbapp_convert_abstract.js");
const {InboundFunctionCallData, FunctionCallData, MessageData, EncodeInfo} = require("@modules/chain/stellar/utils/InboundCallDataClass.js");
const { toBigNumber } = require("@framework/comm/lib.js");
const {hexTrip0x} = require("@framework/comm/lib.js");


module.exports = class NftMarketAppConverter extends WmbAppConvertAbstract {

  constructor(chainType = null, log = global.syncLogger ? global.syncLogger : console) {
    super(chainType, log);
    this.setConvertContract();
  }

  encodeFunctionCallData(messageData) {
    let messageDataClsObj = null;
    if (messageData instanceof MessageData) {
      messageDataClsObj = messageData;
    }else {
      messageDataClsObj = new MessageData(
        messageData.messageType,
        messageData.nftContract,
        toBigNumber(messageData.nftId).toFixed(),
        hexTrip0x(messageData.priceToken),
        toBigNumber(messageData.price).toFixed(),
        hexTrip0x(messageData.recipient),
        hexTrip0x(messageData.buyer)
      )
    }
    let functionCallData = new FunctionCallData(this.func, messageDataClsObj.toXdrBytes());
    return functionCallData.toXdrBytes();
  }

  decodeFunctionCallData(functionCallDataXdrBytes) {
    let funcCallData = functionCallDataXdrBytes;
    if(typeof functionCallDataXdrBytes === "string") {
      funcCallData = JSON.parse(funcCallData);
    }
    const functionCallDataObj = scValToNative(xdr.ScVal.fromXDR(functionCallDataXdrBytes));
    // const messageFunc = functionCallDataObj.messageFunc;
    // const messageDataBytes = functionCallDataObj.messageData;

    const messageDataObj = this.decodeMessageData(functionCallDataObj.messageData);

    return {
      messageFunc: functionCallDataObj.messageFunc,
      messageData: messageDataObj
    }
  }

  //=============================  lower-level (business level data)  ================================
  /**
   *
   * @param encodeMessage: message data object from others chains, such as EVM's Eth/Polygon
   *
   * @returns {*}
   */
  encodeMessageData(encodeMessage) {
    let messageData = new MessageData(
      encodeMessage.messageType,
      encodeMessage.nftContract,
      encodeMessage.nftId,
      encodeMessage.priceToken,
      encodeMessage.price,
      encodeMessage.recipient,
      encodeMessage.buyer,
    )
    return messageData.toXdrBytes();
  }


  decodeMessageData(messageDataXdrBytes) {
    if(typeof messageDataXdrBytes === "string") {
      messageDataXdrBytes = JSON.parse(messageDataXdrBytes);
    }
    const messageData = scValToNative(xdr.ScVal.fromXDR(messageDataXdrBytes));
    messageData.recipient = messageData.recipient.toString();
    messageData.priceToken = messageData.priceToken.toString();
    messageData.nftId = (toBigNumber(messageData.nftId)).toFixed();
    messageData.price = (toBigNumber(messageData.price)).toFixed();
    return messageData;
  }

}
