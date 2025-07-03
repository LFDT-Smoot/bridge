const { Router } = require('express');
const bodyParser = require('body-parser');
const _ = require("lodash");

let frameworkService = require("../../frameworkService/frameworkService");
const { BigNumber } = require('ethers');

class NftRouterControl {
  constructor(){
  }

  async init() {
    const router = Router();

    router.get("/balanceOf/:address", this.balanceOf);
    router.post("/queryNftIds", bodyParser.json({ inflate: true }), this.queryNftIds);
    router.get("/ownerOf/:nftId", this.ownerOf);
    router.get("/metadata/:nftId", this.metadata);

    return router;
  }

  async balanceOf(req, res) {
    try {
      let addr = req.params.address;

      let configService = frameworkService.getService("ConfigService");
      let nftInfoTable = configService.getGlobalConfig("nftInfoTable");
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        owner: addr
      };

      let count = await mongoDB.queryCount(nftInfoTable, whereJson);
      res.send({status: true, result: count});
    }
    catch (err) {
      console.log("queryOrderCount err:", err);
      res.send({ status: false });
    }
  }

  async queryNftIds(req, res) {
    try {
      let params = req.body;
      let address = params.address;
      let pageIndex = Number(params.pageIndex);
      let pageSize = Number(params.pageSize);

      let configService = frameworkService.getService("ConfigService");
      let nftInfoTable = configService.getGlobalConfig("nftInfoTable");
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        owner: address
      };

      let skip = pageIndex * pageSize;
      let aggregateJson = [
        {
          "$match": whereJson
        },
        {
          "$sort": { "nftId": 1 }
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
            "owner": 0
          }
        },
      ];

      let queryRes = await mongoDB.aggregate(nftInfoTable, aggregateJson);
      queryRes = queryRes.map(it => {
        return it.nftId
      } );

      res.send( { status: true, result: queryRes });
    }
    catch(err) {
      console.log("queryNftIds err:", err);
      res.send({ status: false });
    }
  }

  async ownerOf(req, res) {
    try {
      let nftId = req.params.nftId;
      let configService = frameworkService.getService("ConfigService");
      let nftInfoTable = configService.getGlobalConfig("nftInfoTable");
      let mongoDB = frameworkService.getService("MongoDBService");

      let whereJson = {
        nftId: nftId
      };

      let queryRes = await mongoDB.queryOne(nftInfoTable, whereJson, {}, {});
      if(queryRes) {
        res.send( { status: true, result: queryRes.owner });
      }
      else {
        res.send( { status: true, result: "" });
      }
    }
    catch (err) {
      console.log("ownerOf err:", err);
      res.send({ status: false});
    }
  }

  async metadata(req, res) {
    try {
      let nftId = req.params.nftId;
      let configService = frameworkService.getService("ConfigService");
      let nftMetadatas = configService.getGlobalConfig("nftMetadatas");
      if(nftMetadatas[nftId]) {
        let nftMetadata = nftMetadatas[nftId];
        let metadata = {
          "name": nftMetadata.name,
          "description": nftMetadata.description,
          "image": "/nft/image/" + nftMetadata.name + ".png"
        }
        res.send( { status: true, result: metadata });
        return ;
      }
      else {
        let bn_nftId = new BigNumber.from(nftId);
        let mod = bn_nftId.mod(3).toString();

        let metadata = {
          "name": nftId + " token name",
          "description": nftId + " description",
          "image": "/nft/image/" + mod + ".png"
        }
        res.send( { status: true, result: metadata });
      }
    }
    catch (err) {
      console.log("metadata err:", err);
      res.send({ status: false});
    }
  }
}

module.exports = async () => {
    const c = new NftRouterControl();
    return await c.init();
};

