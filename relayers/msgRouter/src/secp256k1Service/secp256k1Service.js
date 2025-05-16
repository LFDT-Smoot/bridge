/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const Web3 = require("web3");
let web3 = new Web3();

const elliptic = require('elliptic')
const secp256k1 = elliptic.ec('secp256k1');

let frameworkService = require("../frameworkService/frameworkService");

module.exports = class Secp256k1Service {
  constructor(){
  }

  verifySignature(hexPk, hexHash, hexSign) {
    let utilService = frameworkService.getService("UtilService");
    let pk = utilService.hexTrip0x(hexPk);
    let hex_signature = utilService.hexTrip0x(hexSign);
    let keyPair = secp256k1.keyFromPublic(Buffer.from(pk, "hex"));

    let buf_signature = Buffer.from(hex_signature, "hex");
    let verify_signature = {
      r : Buffer.from(buf_signature.slice(0, 32)),
      s : Buffer.from(buf_signature.slice(32, 64))
    };

    return keyPair.verify(hexHash, verify_signature);
  }
};

