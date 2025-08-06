/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

let frameworkService = require("../frameworkService/frameworkService");

const StellarSdk = require('@stellar/stellar-sdk');
const axios = require("axios");
const fetch = require("fetch").fetchUrl;

const _ = require("lodash");
const ScanChainBase = require("../scanChainBase/scanChainBase");

const TimeoutPromise = require('../utils/timeoutPromise')

const HorizonClient = require("../utils/stellar/client_horizon");

const {eventParser, get_wmb_gate_events_data} = require("../utils/stellar/tx_event_parser");

// Get value from event's data node:
const getValue = (valueObj) =>  Object.values(valueObj)[0];

function isArray(value) {
  return Array.isArray(value);
}

function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  let proto = Object.getPrototypeOf(value);
  if (proto === null) {
    // Objects created with Object.create(null) have no prototype
    return true;
  }
  let Ctor = proto.constructor;
  return typeof Ctor === 'function' && Ctor === Object;
}

function hexAdd0x(hexs) {
  if (hexs && 0 != hexs.indexOf('0x')) {
    return '0x' + hexs;
  }
  return hexs;
}

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
    console.log("scanChain chainType:", this.chainType, "blockNumber:", blockNumber);
    const txs = await this.client.getTxsInLedger(blockNumber);
    for(let idx = 0; idx < txs.length; ++idx) {
      let tx = txs[idx];

      let txMeta = tx.result_meta_xdr;

      if(!txMeta) {
        // to get tx meta data
        const txInfo = await this.client.getTransactionDetails(tx.hash);
        // console.log("\n\n...txInfo: ", txInfo);
        txMeta = txInfo.resultMetaXdr;
      }

      if(!txMeta){
        console.log("\n...tx resultMetaXdr is empty?: ", !!!txMeta);
        console.log("\n...tx result_meta_xdr is empty?: ", !!!tx.result_meta_xdr);
        continue;
      }

      const txEvents = await eventParser(txMeta);
      if(txEvents) {
        for(let idx_event = 0; idx_event < txEvents.length; ++idx_event) {
          let event = txEvents[idx_event];
          if(event.contractId === this.config.nftMarketAddr) {
            let date = new Date(tx.created_at);
            let msTime = date.getTime();
            await this.process_nftMarket_event(event, tx.source_account, tx.id, msTime, blockNumber);
          }
          else if(event.contractId === this.config.nftContractAddr) {
            const firstTopic = getValue(event.topics[0]);
            if("mint" === firstTopic) {
              await this.process_nft_mint_event(event);
            }
            else if("burn" === firstTopic) {
              await this.process_nft_burn_event(event);
            }
            else if("transfer" === firstTopic) {
              await this.process_nft_transfer_event(event);
            }
          }
        }
      }
    }
  }

  async process_nft_mint_event(event) {

    const [ _adminAddrObj, toAddrObj, nftIdObj] = event.data;
    let toAddr = getValue(toAddrObj);
    let nftId = getValue(nftIdObj);
    
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

    const [ _, nftIdObj] = event.data;

    let nftId = getValue(nftIdObj);

    let whereJson = {
      nftId: nftId
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let configService = frameworkService.getService("ConfigService");
    let tblName = configService.getGlobalConfig("nftInfoTable");
    await mongoService.deleteOne(tblName, whereJson);
  }

  async process_nft_transfer_event(event) {
    const [ _eventNameObj, _fromAddrObj, toAddrObj] = event.topics;

    if(getValue(_eventNameObj) !== "transfer") {
      return;
    }
    const nftIdObj = event.data;
    if(!isPlainObject(nftIdObj)) {
      console.log("process_nft_transfer_event(), invalid data: ", event.data);
      return;
    }
    let toAddr = getValue(toAddrObj);
    let nftId = getValue(nftIdObj);

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
    let expected_topics = ["CreateOrder","CancelOrder", "OrderSuccess", "CancelSuccess"];
    const actualTopics = event.topics;
    let bTopicMatched = false;
    for(let i = 0; i < actualTopics.length; i++) {
      let oneActualTopic = Object.values(actualTopics[i])[0]; // TODO: maybe need to check second/third/... topic
      if(expected_topics.includes(oneActualTopic)) {
        bTopicMatched = true;
        break;
      }
    }

    if(bTopicMatched) {

      const [orderKeyObj, messageDataNode] = event.data;

      const orderKeyStr = getValue(orderKeyObj);

      let messageData = this._parseMessageDataNode(messageDataNode["map"]);
      messageData = this._messageDataFormatConvert(messageData);
      messageData.orderKey = orderKeyStr;

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

  _parseMessageDataNode(paramArray){
    let messageData = {};
    paramArray.map((item) => {
      messageData[getValue(item.key)] = getValue(item.val)
    });
    return messageData;
  }

  _messageDataFormatConvert(event) {
    return {
      buyer : event.buyer,
      messageType: event.messageType ? event.messageType : event.message_type, //check order: XDR-V4, XDR-V3
      nftContract: event.nftContract ? event.nftContract : event.nft_contract, //v4 is camelCase, v3 is snake_case
      nftId: event.nftId ? event.nftId : event.nft_id,
      price: event.price,
      priceToken: hexAdd0x(event.priceToken ? event.priceToken : event.price_token),
      recipient: hexAdd0x(event.recipient),
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

