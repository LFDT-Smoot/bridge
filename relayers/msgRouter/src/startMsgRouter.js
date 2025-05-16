/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

let frameworkService = require("./frameworkService/frameworkService");
let ConfigService = require("./configService/configService");
let MongoDBService = require("./mongodbService/mongodbService");
let UtilService = require("./utilService/utilService");

let Ed25519Service = require("./ed25519Service/ed25519Service");
let Secp256k1Service = require("./secp256k1Service/secp256k1Service");
let VerifySignatureService = require("./verifySignatureService/verifySignatureService");
let RestApiService = require("./restApiService/restApiService");

let configJson = require("../conf/config.json");
const { config } = require("dotenv");
configJson = configJson[configJson.currentnet];

class Start {
    constructor() {
    }

    async start() {
        try {
          console.log("Start.start()****************************");
          let utilService = new UtilService();
          frameworkService.registerService("UtilService", utilService);

          let configService = new ConfigService();
          for(let idx = 0; idx < configJson.pks.length; ++idx) {
            configJson.pks[idx] = utilService.hexTrip0x(configJson.pks[idx]);
          }

          configService.init(configJson);
          frameworkService.registerService("ConfigService", configService);

          let mongoDb = new MongoDBService();
          let mongoUrl = configService.getGlobalConfig("mongoUrl");
          await mongoDb.init(mongoUrl);
          frameworkService.registerService("MongoDBService", mongoDb);

          let ed25519Service = new Ed25519Service();
          frameworkService.registerService("Ed25519Service", ed25519Service);

          let secp256k1Service = new Secp256k1Service();
          frameworkService.registerService("Secp256k1Service", secp256k1Service);

          let verifySignatureService = new VerifySignatureService();
          frameworkService.registerService("VerifySignatureService", verifySignatureService);

          let restApiService = new RestApiService();
          await restApiService.init();
          frameworkService.registerService("RestApiService", restApiService);          
        }
        catch (err) {
            console.log("Start err message:", err.message);
            console.log("Start err stack:", err.stack);
        }
    }
}

let start = new Start();
start.start();
console.log("running...");

module.exports = start;
