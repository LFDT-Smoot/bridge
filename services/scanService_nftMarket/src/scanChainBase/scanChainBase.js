
'use strict';

let frameworkService = require("../frameworkService/frameworkService");


module.exports = class ScanChainBase {
  constructor(chainType){
    this.chainType = chainType;
  }

  async init() {
    let configService = frameworkService.getService("ConfigService");
    let config = configService.getGlobalConfig(this.chainType);
    this.config = config;
  }

  async scanChain(blockNumber) {
    throw new Error("SHOULD IMPLEMENTED BY Children Class.");
  }

  async loop() {
    let utilService = frameworkService.getService("UtilService");
    while (1) {
      try {
        let needScanBlockNumber = await this.getNeedScanBlockNumber();
        let latestBlockNumber = await this.getLastestBlockNumber();
        if(latestBlockNumber >= needScanBlockNumber) {
          await this.scanChain(needScanBlockNumber);
          await this.updateScanedBlockNumber(needScanBlockNumber);
          if(latestBlockNumber > needScanBlockNumber + 1) {
            continue;
          }
        }
      } catch (err) {
        console.log("chainType:", this.chainType, "loop err:", err);
      }
      await utilService.sleep(this.config.scanIntervalMs);
    }
  }

  async updateScanedBlockNumber(scanedBlockNumber) {
    let updateJson = {
      "$set": {
          "chainType": this.chainType,
          "scanedBlockNumber": scanedBlockNumber
      }
    };
    let configService = frameworkService.getService("ConfigService");
    let tblName = configService.getGlobalConfig("scanedInfoTbl");
    let whereJson = { "chainType": this.chainType };
    let mongoService = frameworkService.getService("MongoDBService");
    let ret = await mongoService.insertOrUpdateOne(tblName, whereJson, updateJson);
    if(ret === false) {
      throw(this.chainType + "updateScanedBlockNumber fail");
    }
  }

  async getNeedScanBlockNumber() {
    let mongoService = frameworkService.getService("MongoDBService");
    let whereJson = {
      chainType: this.chainType
    };
    let configService = frameworkService.getService("ConfigService");
    let scanedInfoTbl = configService.getGlobalConfig("scanedInfoTbl");
    let data = await mongoService.queryOne(scanedInfoTbl, whereJson, {}, {});
    if(data === null) {
      return this.config.beginScanBlockNumber;
    }
    else{
      return data.scanedBlockNumber + 1;
    }
  }
};

