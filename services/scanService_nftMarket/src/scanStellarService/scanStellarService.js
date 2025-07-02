
'use strict';

let frameworkService = require("../frameworkService/frameworkService");

const StellarSdk = require('@stellar/stellar-sdk');
const axios = require("axios");
const fetch = require("fetch").fetchUrl;

const _ = require("lodash");
const ScanChainBase = require("../scanChainBase/scanChainBase");

const TimeoutPromise = require('../utils/timeoutPromise')

const HorizonClient = require("../utils/stellar/client_horizon");

const {eventParser, get_events_data_by} = require("../utils/stellar/tx_event_parser");

module.exports = class ScanStellarService extends ScanChainBase {
  constructor(){
    super("XLM");
    this.log = console;
  }

  async init() {
    await super.init();
    console.log("scanStellarService this.config:", this.config);
    this.client = new HorizonClient(this.config.horizonUrl, this.log);

    this.loop();
  }

  async scanChain(blockNumber) {
    //console.log("scanChain chainType:", this.chainType, "blockNumber:", blockNumber);
    const txs = await this.client.getTxsInLedger(blockNumber);
    for(let idx = 0; idx < txs.length; ++idx) {
      let tx = txs[idx];

      let txMeta = tx.result_meta_xdr;

      if(!txMeta) {
        // to get tx meta data
        const txInfo = await this.client.getTransactionDetails(tx.hash);
        console.log("\n\n...txInfo: ", txInfo);
        txMeta = txInfo.resultMetaXdr;
      }
      console.log("\n\n...tx resultMetaXdr: ", txMeta);
      console.log("\n\n...tx result_meta_xdr: ", tx.result_meta_xdr);

      if(!txMeta){
        continue;
      }

      const txEvents = eventParser(txMeta);
      if(txEvents) {
        for(let idx_event = 0; idx_event < txEvents.length; ++idx_event) {
          let event = txEvents[idx_event];
          if(event.contractId === this.config.nftMarketAddr) {
            let date = new Date(tx.created_at);
            let msTime = date.getTime();
            await this.process_nftMarket_event(event, tx.source_account, tx.id, msTime, blockNumber);
          }
          else if(event.contractId === this.config.nftContractAddr) {
            if("mint" === event.topics.nodes[0].nodes[0].value) {
              await this.process_nft_mint_event(event);
            }
            else if("burn" === event.topics.nodes[0].nodes[0].value) {
              await this.process_nft_burn_event(event);
            }
            else if("transfer" === event.topics.nodes[0].nodes[0].value) {
              await this.process_nft_transfer_event(event);
            }
          }
        }
      }
    }
  }

  async process_nft_mint_event(event) {
    if(event.data.type !== "data" || event.data.value !== "[scvVec]") {
      return;
    }

    const dataVec = event.data.nodes[0];
    //let adminAddr = dataVec.nodes[0].nodes[0].value;
    let toAddr = dataVec.nodes[1].nodes[0].value;
    let nftId = dataVec.nodes[2].nodes[0].value;
    
    let whereJson = {
      nftId: nftId
    };

    let updateJson = {
      "$set" : {
        nftId: nftId,
        owner: toAddr
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let configService = frameworkService.getService("ConfigService");
    let tblName = configService.getGlobalConfig("nftInfoTable");
    await mongoService.insertOrUpdateOne(tblName, whereJson, updateJson);
    await mongoService.createIndex(tblName, { "nftId": 1 }, { "unique": true, "background": true });
  }

  async process_nft_burn_event(event) {
    const dataVec = event.data.nodes[0];
    let nftId = dataVec.nodes[1].nodes[0].value;
    if(event.data.type !== "data" || event.data.value !== "[scvVec]") {
      return;
    }

    let whereJson = {
      nftId: nftId
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let configService = frameworkService.getService("ConfigService");
    let tblName = configService.getGlobalConfig("nftInfoTable");
    await mongoService.deleteOne(tblName, whereJson);
  }

  async process_nft_transfer_event(event) {
    const dataVec = event.data.nodes[0];
    //let fromAddr = dataVec.nodes[0].nodes[0].value;
    let toAddr = dataVec.nodes[1].nodes[0].value;
    let nftId = dataVec.nodes[2].nodes[0].value;

    if(event.data.type !== "data" || event.data.value !== "[scvVec]") {
      return;
    }

    let whereJson = {
      nftId: nftId
    };

    let updateJson = {
      "$set" : {
        owner: toAddr
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let configService = frameworkService.getService("ConfigService");
    let tblName = configService.getGlobalConfig("nftInfoTable");
    await mongoService.updateOne(tblName, whereJson, updateJson);
  }

  async process_nftMarket_event(event, fromAddr, txId, txDate, blockNumber) {
    let e = event;
    let expected_topics = ["CreateOrder","CancelOrder", "OrderSuccess", "CancelSuccess"];
    const actualTopics = e.topics.nodes;
    let bTopicMatched = false;
    for(let i = 0; i < actualTopics.length; i++) {
      if(expected_topics.includes(actualTopics[i].nodes[0].value)) {
        bTopicMatched = true;
        break;
      }
    }

    if(bTopicMatched) {
      if(e.data.type !== "data" || e.data.value !== "[scvVec]") {
        return
      }

      const dataVec = e.data.nodes[0];
      const orderKeyNode = dataVec.nodes[0];
      const messageDataNode = dataVec.nodes[1];

      const orderKeyHexArrayStr = orderKeyNode.nodes[0].value;
      const messageDataJsonStr = messageDataNode.nodes[0].value;
      const orderKey = Buffer.from(JSON.parse(orderKeyHexArrayStr)).toString("hex");
      const messageData = JSON.parse(messageDataJsonStr);

      messageData.recipient = "0x" + Buffer.from(messageData.recipient.data).toString().toLowerCase();
      messageData.priceToken = "0x" + Buffer.from(messageData.priceToken.data).toString().toLowerCase();
      messageData.orderKey = orderKey;

      if(messageData.messageType === "CreateOrder") {
        await this.processCreateOrder(messageData, fromAddr, txId, txDate, blockNumber);
      }
      else if(messageData.messageType === "CancelOrder") {
        await this.processCancelOrder(messageData, txId, txDate, blockNumber);
      }
      else if(messageData.messageType === "OrderSuccess") {
        await this.processOrderSuccess(messageData, txId, txDate, blockNumber);
      }
      else if(messageData.messageType === "CancelSuccess") {
        await this.processCancelSuccess(messageData, txId, txDate, blockNumber);
      }
    }
  }

  async processCreateOrder(ev, fromAddr, txId, txDate, blockNumber) {
    // processCreateOrder ev: {
    //   buyer: 'GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4',
    //   messageType: 'CreateOrder',
    //   nftContract: 'CAK3YU4RRTL6BFHK6ES5N7346OVKZGTVO4XNPKVBWQMS4UT6NPXL4IEH',
    //   nftId: '20006',
    //   price: '123456',
    //   priceToken: '42423445393932646141366135313837324331354266396462386630373236323462393144333742',
    //   recipient: '42423445393932646141366135313837324331354266396462386630373236323462393144333742',
    //   orderKey: 'a453b7a418dbbbd6391b23a1f9eb98306fe5c7337c3924042771e148ebd195cc'
    // }

    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");

    let insertJson = {
      nftContract: ev.nftContract,
      nftId: ev.nftId,
      priceToken: ev.priceToken,
      recipient: ev.recipient,

      xlmOrderKey: ev.orderKey,
      xlmAddr: fromAddr,
      price: ev.price,
      status: orderStatus.status_listing,
      xlmCreateOrder: ev,

      xlmCreateOrderTxId: txId,
      xlmCreateOrderTime: txDate,
      xlmCreateOrderBlockNumber: blockNumber
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.insertOne(tblName, insertJson);
  }

  async processCancelOrder(ev, txId, txDate, blockNumber) {
    // console.log("processCreateOrder ev:", ev);
    // {
    //   orderKey: '0c25199ed7e21d6ec021cc81ab48fd625bfb0b3c32817eda8289d57a1cf7bd2c',
    //   buyer: 'GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4',
    //   messageType: 'CancelOrder',
    //   nftContract: 'CBUXWGP7Q4ENVZ6J2KCSZTPI47EJJKE2EAPRROEZY6VCUAIUSEC3P6IA',
    //   nftId: '20003',
    //   price: '123456',
    //   priceToken: '42423445393932646141366135313837324331354266396462386630373236323462393144333742',
    //   recipient: '42423445393932646141366135313837324331354266396462386630373236323462393144333742'
    // }
    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");

    let whereJson = {
      "nftId": ev.nftId,
      "status": {"$in": [orderStatus.status_listing, orderStatus.status_onsale]}
    };

    let updateJson = {
      "$set": {
        status: orderStatus.status_canceling,
        xlmCancelOrderTxId: txId,
        xlmCancelOrderTime: txDate,
        xlmCancelOrderBlockNumber: blockNumber
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.updateOne(tblName, whereJson, updateJson);
  }

  async getLastestBlockNumber() {
    return await this.client.getLastLedgerSequence();
  }

  async processOrderSuccess(ev, txId, txDate, blockNumber) {
    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");

    let whereJson = {
      "nftId": ev.nftId,
      "status": {"$in": [orderStatus.status_canceling, orderStatus.status_onsale]}
    };

    let updateJson = {
      "$set": {
        status: orderStatus.status_successed,
        xlmOrderSuccessTxId: txId,
        xlmOrderSuccessTime: txDate,
        xlmOrderSuccessBlockNumber: blockNumber
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.updateOne(tblName, whereJson, updateJson);
  }

  async processCancelSuccess(ev, txId, txDate, blockNumber) {
    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");

    let whereJson = {
      "nftId": ev.nftId,
      "status": {"$in": [orderStatus.status_canceling]}
    };

    let updateJson = {
      "$set": {
        status: orderStatus.status_canceled,
        xlmCancelFailedTxId: txId,
        xlmCancelFailedTime: txDate,
        xlmCancelFailedBlockNumber: blockNumber
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.updateOne(tblName, whereJson, updateJson);
  }
};

