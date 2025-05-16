/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let stellarSdk = require("@stellar/stellar-sdk");
let frameworkService = require("../frameworkService/frameworkService");

module.exports = class Ed25519Service {
  constructor(){
  }

  verifySignature(hexPk, hexHash, hexSign) {
    let utilService = frameworkService.getService("UtilService");
    hexPk = utilService.hexTrip0x(hexPk);
    hexSign = utilService.hexTrip0x(hexSign);
    hexHash = utilService.hexTrip0x(hexHash);
    if(hexHash.length !== 64) {
      return false;
    }
    if(hexSign.length !== 128) {
      return false;
    }

    let keypair_fromPk = stellarSdk.Keypair.fromPublicKey(hexPk);
    return keypair_fromPk.verify(Buffer.from(hexHash, "hex"), Buffer.from(hexSign, "hex"));
  }
};


