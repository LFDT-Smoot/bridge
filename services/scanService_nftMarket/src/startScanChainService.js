"use strict"

let frameworkService = require("./frameworkService/frameworkService");
let ConfigService = require("./configService/configService");
let MongoDBService = require("./mongodbService/mongodbService");
let UtilService = require("./utilService/utilService");

let ScanStellarService = require("./scanStellarService/scanStellarService");
let ScanPolygonService = require("./scanPolygonService/scanPolygonService");

let RestApiService = require("./restApiService/restApiService");

let configJson = require("../conf/config");
console.log("configJson:", configJson)

class Start {
    constructor() {
    }

    async start() {
        try {
          console.log("Start.start()****************************");

          let configService = new ConfigService();
          configService.init(configJson);
          frameworkService.registerService("ConfigService", configService);

          let mongoDb = new MongoDBService();
          let mongoUrl = configService.getGlobalConfig("mongoUrl");
          await mongoDb.init(mongoUrl);
          frameworkService.registerService("MongoDBService", mongoDb);

          let utilService = new UtilService();
          frameworkService.registerService("UtilService", utilService);

          let scanStellarService = new ScanStellarService();
          await scanStellarService.init();
          frameworkService.registerService("ScanStellarService", scanStellarService);

          let scanPolygonService = new ScanPolygonService();
          await scanPolygonService.init();
          frameworkService.registerService("ScanPolygonService", scanPolygonService);

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
