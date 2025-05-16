/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const { Router } = require('express');
const bodyParser = require('body-parser');
const _ = require("lodash");

let frameworkService = require("../../frameworkService/frameworkService");

const txSignStatus_collect = 0;
const txSignStatus_finish = 1;
const txSignStatus_notEnough = 2;

class MsgRouterControl {
  constructor(){
  }

  async init() {
    const router = Router();

    router.post('/addTxForSign/:chainType', bodyParser.json({ inflate: true }), this.addTxForSign);
    router.get('/queryTxForSign/:chainType/:toSignPk', this.queryTxForSign);
    router.post('/addTxSignature/:chainType', bodyParser.json({ inflate: true }), this.addTxSignature);
    router.get("/queryTxSignature/:chainType/:uniqueId", this.queryTxSignature);

    return router;
  }

  async addTxForSign(req, res) {
    try {
      let chainType = req.params.chainType;
      chainType = chainType.toUpperCase();
      let txObj = req.body;
      // example
      // {
      //   "uniqueId": "....",
      //   "dataHash":"...",
      //   "pk": "...",
      //   "signature": "...",
      //   "rawData": "...",
      // }

      let utilService = frameworkService.getService("UtilService");
      txObj.pk = utilService.hexTrip0x(txObj.pk);

      let verifySignatureService = frameworkService.getService("VerifySignatureService");
      if(false === verifySignatureService.verifySignature(chainType, txObj.pk, txObj.dataHash, txObj.signature)) {
        res.send({ status: false, "err": "checkPkAndSignature fail"});
        return ;
      }

      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      let mongoDB = frameworkService.getService("MongoDBService");
      let whereJson = {
        "uniqueId": txObj.uniqueId
      };

      let updateJson = {
        "$set" : {
          chainType: chainType,
          uniqueId: txObj.uniqueId,
          dataHash: txObj.dataHash,
          rawData: txObj.rawData,
          minSignCount: txObj.minSignCount,

          timestamp : _.now(),
          status: txSignStatus_collect,
          signInfo:[
            {
              pk: txObj.pk,
              signature: txObj.signature,
              timestamp: _.now()
            }
          ]
        }
      };
      if(txObj.minSignCount === 1) {
        updateJson["$set"].status = txSignStatus_finish;
      }

      let ret = await mongoDB.insertOrUpdateOne(txTableName, whereJson, updateJson);
      if(ret === false) {
        res.send({ status: false, "err": "save to db fail" });
        return ;
      }
      await mongoDB.createIndex(txTableName, { "chainType":1, "uniqueId": 1, "dataHash":1 }, { "unique": true, "background": true, collation: { locale: "en", strength: 2 } });
      res.send({status: true});
    }
    catch (err) {
      console.log("addTxForSign err:", err);
      res.send({ status: false, "err": "catch err" });
    }
  }

  async queryTxForSign(req, res) {
    try {
      let chainType = req.params.chainType;
      let toSignPk = req.params.toSignPk;
      chainType = chainType.toUpperCase();

      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      let mongoDB = frameworkService.getService("MongoDBService");

      let aggregateJson = [
        {
          "$match": { "chainType": chainType, "status": txSignStatus_collect, "signInfo.pk" : {"$nin": [toSignPk]} }
        },
        {
          "$sort": { "timestamp": 1 }
        },
        {
          "$project": {
            "_id": 0,
            "status": 0,
            "timestamp": 0,
            "signInfo": 0,
            "minSignCount":0
          }
        }
      ];
      let ret = await mongoDB.aggregate(txTableName, aggregateJson);
      res.send( { status: true, result: ret });
    }
    catch(err) {
      console.log("queryTxForSign err:", err);
      res.send({ status: false });
    }
  }

  async addTxSignature(req, res) {
    try {
      let chainType = req.params.chainType;
      chainType = chainType.toUpperCase();
      let txObj = req.body;
      // example
      // {
      //   uniqueId: uniqueId,
      //   pk: hexPk
      //   dataHash:dataHash,
      //   signature: hexSignature
      // }
      let utilService = frameworkService.getService("UtilService");
      txObj.pk = utilService.hexTrip0x(txObj.pk);
      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        "chainType": chainType,
        "uniqueId": txObj.uniqueId,
        "dataHash": txObj.dataHash
      };

      let rec = await mongoDB.queryOne(txTableName, whereJson, {}, {});
      if(rec === null) {
        res.send({status: false, "err": "no found tx"});
        return ;
      }
      let minSignCount = rec.minSignCount;
      let verifySignatureService = frameworkService.getService("VerifySignatureService");
      if(false === verifySignatureService.verifySignature(chainType, txObj.pk, txObj.dataHash, txObj.signature)) {
        res.send({ status: false, "err": "checkPkAndSignature fail"});
        return ;
      }

      let foundItem = rec.signInfo.find(item => item.pk === txObj.pk);
      if(foundItem !== undefined) {
        res.send({ status: true });
        return ;
      }

      let updateJson = {
        "$push": {
          signInfo: {
            "pk": txObj.pk,
            signature: txObj.signature,
            "timestamp": _.now()
          }
        }
      };

      if(minSignCount === rec.signInfo.length + 1) {
        updateJson["$set"] = {
          "status": txSignStatus_finish
        }
      }
      await mongoDB.updateOne(txTableName, whereJson, updateJson);
      res.send({status: true});
    }
    catch (err) {
      console.log("addTxSignature err:", err);
      res.send({ status: false});
    }
  }

  async queryTxSignature(req, res) {
    try {
      let chainType = req.params.chainType;
      chainType = chainType.toUpperCase();
      let uniqueId = req.params.uniqueId;

      let configService = frameworkService.getService("ConfigService");
      let txTableName = await configService.getGlobalConfig("txSignTableName");
      let mongoDB = frameworkService.getService("MongoDBService");

      let aggregateJson = [
        {
          "$match": { "chainType": chainType, "uniqueId": uniqueId }
        },
        {
          "$project": {
            "_id": 0,
            "chainType": 0,
            "uniqueId": 0,
            "dataHash": 0,
            "rawData": 0,
            "timestamp": 0,
            "status": 0
          }
        },
      ];

      let ret = await mongoDB.aggregate(txTableName, aggregateJson);
      if(ret.length === 0) {
        res.send( { status: false });
        return ;
      }
      ret = ret[0];

      let result = {
        count: ret.signInfo.length
      };

      if(ret.signInfo.length < ret.minSignCount) {
        result.signatures = [];
      }
      else {
        result.signatures = ret.signInfo;
      }

      res.send( { status: true, result: result });
    }
    catch(err) {
      console.log("queryTxSignature err:", err);
      res.send({ status: false });
    }
  }

  checkPkAndSignature(chainType, pk, dataHash, signature) {
    let verifySignatureService = frameworkService.getService("VerifySignatureService");
    if(!verifySignatureService.verifySignature(chainType, pk, dataHash, signature)) {
      return false;
    }
    return true;
  }
}

module.exports = async () => {
    const c = new MsgRouterControl();
    return await c.init();
};

