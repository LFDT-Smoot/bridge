const { Router } = require('express');
const bodyParser = require('body-parser');
const _ = require("lodash");

let frameworkService = require("../../frameworkService/frameworkService");

class MsgRouterControl {
  constructor(){
  }

  async init() {
    const router = Router();

    router.post("/queryOrderCount", bodyParser.json({ inflate: true }), this.queryOrderCount);
    router.post("/queryOrder", bodyParser.json({ inflate: true }), this.queryOrder);

    return router;
  }

  async queryOrderCount(req, res) {
    try {
      let params = req.body;

      let configService = frameworkService.getService("ConfigService");
      let orderInfoTbl = configService.getGlobalConfig("orderInfoTbl");
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        status: {"$in": params.status}
      };

      let addrAry = [];
      if(params.xlmAddr) {
        addrAry.push({ xlmAddr : params.xlmAddr });
      }

      if(params.maticAddr) {
        addrAry.push({ maticAddr : params.maticAddr });
      }
      if(addrAry.length > 0) {
        whereJson["$or"] = addrAry;
      }

      let count = await mongoDB.queryCount(orderInfoTbl, whereJson);
      res.send({status: true, result: count});
    }
    catch (err) {
      console.log("queryOrderCount err:", err);
      res.send({ status: false });
    }
  }

  async queryOrder(req, res) {
    try {
      let params = req.body;

      let pageIndex = Number(params.pageIndex);
      let pageSize = Number(params.pageSize);

      let configService = frameworkService.getService("ConfigService");
      let orderInfoTbl = configService.getGlobalConfig("orderInfoTbl");
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        status: {"$in": params.status}
      };

      let addrAry = [];
      if(params.xlmAddr) {
        addrAry.push({ xlmAddr : params.xlmAddr });
      }

      if(params.maticAddr) {
        addrAry.push({ maticAddr : params.maticAddr });
      }
      if(addrAry.length > 0) {
        whereJson["$or"] = addrAry;
      }

      let skip = pageIndex * pageSize;
      let aggregateJson = [
        {
          "$match": whereJson
        },
        {
          "$sort": { "timestamp": -1 }
        },
        {
          "$skip": skip
        },
        {
          "$limit" : pageSize
        },
        {
          "$project": {
            "_id": 0,
            "OrderCreatedEvent": 0,
            "BuyOrderEvent": 0,
            "xlmCreateOrder": 0
          }
        }
      ];

      let queryRes = await mongoDB.aggregate(orderInfoTbl, aggregateJson);

      res.send( { status: true, result: queryRes });
    }
    catch(err) {
      console.log("queryOrder err:", err);
      res.send({ status: false });
    }
  }
}

module.exports = async () => {
    const c = new MsgRouterControl();
    return await c.init();
};

