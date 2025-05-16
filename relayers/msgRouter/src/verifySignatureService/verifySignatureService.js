/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let frameworkService = require("../frameworkService/frameworkService");

module.exports = class VerifySignatureService {
  constructor(){
  }

  verifySignature(chainType, hexPk, hexHash, hexSign) {
    try {

      // check pk
      let configService = frameworkService.getService("ConfigService");
      let pks = configService.getGlobalConfig("pks");

      let foundItem = pks.find(item => item === hexPk);
      if(foundItem === undefined) {
        return false;
      }

      // check signature
      let signVerify = configService.getGlobalConfig("signVerify");
      let verifyServiceName = signVerify[chainType];
      let verifyService = frameworkService.getService(verifyServiceName);
      if(verifyService) {
        return verifyService.verifySignature(hexPk, hexHash, hexSign);
      }

      return false;
    }
    catch(err) {
      console.log("VerifySignatureService verifySignature err:", err);
      return false;
    }
  }
};

