/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const { xdr, scValToNative, ScInt} = require("@stellar/stellar-sdk");

const AbstractConvert = require("@modules/chain/gateway_convert_abstract.js");
const {InboundFunctionCallData, FunctionCallData, MessageData, EncodeInfo} = require("../utils/InboundCallDataClass.js");
const {hexTrip0x} = require("@framework/comm/lib.js");


module.exports = class WmbGateConverter extends AbstractConvert {

  constructor(chainType = null, log = console) {
    super(chainType, log);
  }

  /**
   *
   * @param networkId
   * @param contractAddress
   * @param functionCallData: is an object that to be encoded, should be of format: {'method': xxx, 'messageData': {...}}
   */
  encodeFinalFunctionCallData(networkId, contractAddress, functionCallData) {
    contractAddress = hexTrip0x(contractAddress);
    let inbouCallData = new InboundFunctionCallData(functionCallData, networkId, contractAddress);
    let inboundCallDataBytes = inbouCallData.toXdrBytes();
    inboundCallDataBytes = inboundCallDataBytes.toString("hex");
    console.log("encodeFinalFunctionCallData : inboundCallDataBytes() " + inboundCallDataBytes);
    return inboundCallDataBytes;
  }

  decodeFinalFunctionCallData(finalFuncCallDataXdrBytes) {
    let finalFuncCallData = finalFuncCallDataXdrBytes;
    if(typeof finalFuncCallDataXdrBytes === "string") {
      finalFuncCallData = JSON.parse(finalFuncCallDataXdrBytes);
    }
    let finalFuncCallDataScVal = xdr.ScVal.fromXDR(finalFuncCallData);
    let finalFuncCallDataObj = scValToNative(finalFuncCallDataScVal);
    return finalFuncCallDataObj;
  }


  getEncodeInfo(taskId, networkId, contractAddr, finalFunctionCallDataBytes) {
    taskId = hexTrip0x(taskId);

    if (typeof finalFunctionCallDataBytes === 'string') {
      finalFunctionCallDataBytes = Buffer.from(finalFunctionCallDataBytes, "hex");
    }
    if (!(finalFunctionCallDataBytes instanceof Buffer)) {
      throw new Error("Invalid functionCallData")
    }

    let encodeInfo = new EncodeInfo(finalFunctionCallDataBytes, taskId, networkId, contractAddr);
    let bytesBuffer = encodeInfo.toXdrBytes();
    return bytesBuffer.toString("hex")
  }

  getEncodeProof(secp256k1_signatures) {
    let ScVal = xdr.ScVal;
    let values = [];
    for(let i = 0; i < secp256k1_signatures.length; i++) {

      let data = secp256k1_signatures[i];
      let jsOrig = ScVal.scvMap([
        new xdr.ScMapEntry({
          key:ScVal.scvSymbol('recid'),
          val:new ScInt(data.recid).toU128(),
        }),
        new xdr.ScMapEntry({
          key: ScVal.scvSymbol('signature'),
          val: ScVal.scvBytes(data.signature)
        }),
      ]);

      values.push(jsOrig);
    }

    let totalJsOrig = ScVal.scvMap([
      new xdr.ScMapEntry({
        key: ScVal.scvSymbol('signatures'),
        val: ScVal.scvVec(values)
      })
    ])

    let bytesBuffer = totalJsOrig.toXDR();
    return bytesBuffer.toString("hex");
  }

}
