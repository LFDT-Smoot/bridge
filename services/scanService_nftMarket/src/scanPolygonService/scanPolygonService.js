
'use strict';

const Web3 = require("web3");
const net = require('net');
const web3EthAbi = require("web3-eth-abi");

const ethers = require('ethers');
const _ = require("lodash");

let frameworkService = require("../frameworkService/frameworkService");
const ScanChainBase = require("../scanChainBase/scanChainBase");

let Contract = require("../contract/Contract.js");

module.exports = class ScanPolygonService extends ScanChainBase{
  constructor(){
    super("MATIC");
  }

  async init() {
    await super.init();

    this.eventSignatures = this.getEventSignature(this.config.nftMarketAbi);
    if (this.config.nodeUrl.indexOf("http://") !== -1 || this.config.nodeUrl.indexOf("https://") !== -1) {
      this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.nodeUrl));
    } else {
      this.web3 = new Web3(new Web3.providers.IpcProvider(this.config.nodeUrl, net));
    }

    this.loop();// no need await
  }

  getEventSignature(abi) {
    let knownEvents = {};

    const iface = new ethers.utils.Interface(abi);
    abi.forEach(item => {
      if (item.type === "event") {
        const eventSignature = iface.getEventTopic(item.name);
        knownEvents[eventSignature] = {
          abiEntry: item
        };
      }
    });
    return knownEvents;
  }

  async scanChain(blockNumber) {
    //console.log("scanChain chainType:", this.chainType, "blockNumber:", blockNumber);
    let block = await this.web3.eth.getBlock(blockNumber);
    let txTimestamp = block.timestamp * 1000;

    let filterValue = {
      fromBlock: blockNumber,
      toBlock: blockNumber,
      topics: [],
      address: [this.config.gatewayAddr.toLowerCase()]
    };

    let eventLogs = await this.web3.eth.getPastLogs(filterValue);
    let map_txhash = new Map();
    for(let idx_tx = 0; idx_tx < eventLogs.length; ++idx_tx) {
      map_txhash.set(eventLogs[idx_tx].transactionHash, "");
    }

    for(let txhash of map_txhash.keys()) {
      let receipt = await this.web3.eth.getTransactionReceipt(txhash);
      // ÏÈ¶ÁÈ¡taskId
      let taskId;
      for(let idx_gateway = 0; idx_gateway < receipt.logs.length; ++idx_gateway) {
        let log = receipt.logs[idx_gateway];
        if(log.address.toLowerCase() === this.config.gatewayAddr.toLowerCase()) {
          let gateway_contract = new Contract(this.config.gatewayAbi, this.config.gatewayAddr);
          let decode_log = gateway_contract.parseEvent(log);
          if(decode_log.event === "InboundTaskExecuted" || decode_log.event === "OutboundTaskExecuted") {
            taskId = decode_log.args.taskId;
            break;
          }
        }
      }
      if(!taskId) {
        continue;
      }

      for(let idx_nfrmarket = 0; idx_nfrmarket < receipt.logs.length; ++idx_nfrmarket) {
        let log = receipt.logs[idx_nfrmarket];
        if(log.address.toLowerCase() === this.config.nftMarketAddr.toLowerCase()) {
          let nftmarket_contract = new Contract(this.config.nftMarketAbi, this.config.nftMarketAddr);
          let decode_log = nftmarket_contract.parseEvent(log);
          switch(decode_log.event) {
            case "OrderCreated":{
              await this.processOrderCreated(decode_log, txTimestamp, taskId);
            }
            break;
            case "BuyOrder": {
              await this.processBuyOrder(decode_log, txTimestamp, taskId);
            }
            break;
          }
        }
      }
    }
  }

  async processOrderCreated(log, txTimestamp, taskId) {
    // event OrderCreated(MessageData messageData);
    // {
    //   txHash:...
    //   event: 'OrderCreated',
    //   args: {
    //     '0': {
    //       '0': 'CreateOrder',
    //       '1': '0x65e8d85dcb18bea857d6dc53a401ef847a544013ffd4dae14849008b4f1eb57b',
    //       '2': 99n,
    //       '3': '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //       '4': 88n,
    //       '5': '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //       '6': '0x9c1bfc34ea7e295ac684c026c6d4de765734cb6b37fa07330bcfc241743ebbaf',
    //       __length__: 7,
    //       messageType: 'CreateOrder',
    //       nftContract: '0x65e8d85dcb18bea857d6dc53a401ef847a544013ffd4dae14849008b4f1eb57b',
    //       nftId: 99n,
    //       priceToken: '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //       price: 88n,
    //       recipient: '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //       buyer: '0x9c1bfc34ea7e295ac684c026c6d4de765734cb6b37fa07330bcfc241743ebbaf'
    // }
    let logMsg = log.args.messageData;

    let typeAry = ["bytes", "uint256", "address", "address"];
    let valAry = [logMsg.nftContract, "0x" + logMsg.nftId.toString(16), logMsg.priceToken, logMsg.recipient];
    let encodeData = ethers.utils.solidityPack(typeAry, valAry);
    let orderKey = this.web3.utils.keccak256(encodeData);

    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");
    let whereJson = {
      taskId : taskId,
      "status": {"$in": [orderStatus.status_listing]}
    };

    let updateJson = {
      "$set" : {
        taskId : taskId,
        maticOrderKey: orderKey,
        status: orderStatus.status_onsale,
        OrderCreatedEvent: {
          messageType: logMsg.messageType,
          nftContract: logMsg.nftContract,

          nftId: logMsg.nftId.toString(),
          priceToken: logMsg.priceToken,
          price: logMsg.price.toString(),
          recipient: logMsg.recipient,

          buyer: logMsg.buyer,
          timestamp: txTimestamp,
          txHash: log.transactionHash
        },
        timestamp: txTimestamp,
        maticCreateOrderTime: txTimestamp,
        maticCreateOrderBlockNumber: log.blockNumber
      }
    };

    console.log("processOrderCreated whereJson:", whereJson);
    console.log("processOrderCreated updateJson:", updateJson);

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.insertOrUpdateOne(tblName, whereJson, updateJson);
    await mongoService.createIndex(tblName, { "taskId": 1 }, { "unique": true, "background": true });
    await mongoService.createIndex(tblName, { "maticOrderKey": 1 }, { "unique": true, "background": true });
  }

  async processBuyOrder(log, txTimestamp, taskId) {
    // event BuyOrder(bytes32 indexed orderKey, address indexed buyer, bytes nftContract, uint256 nftId, address priceToken, uint256 price, address recipient);
    // {
    //   event: 'BuyOrder',
    //   args: {
    //     '0': '0x95a66c130e7465e9d8b283e1adcd5f93a208c23c9f8d0286d03a34e2c6b0f265',
    //     '1': '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //     '2': '0x65e8d85dcb18bea857d6dc53a401ef847a544013ffd4dae14849008b4f1eb57b',
    //     '3': 99n,
    //     '4': '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //     '5': 88n,
    //     '6': '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //     __length__: 7,
    //     orderKey: '0x95a66c130e7465e9d8b283e1adcd5f93a208c23c9f8d0286d03a34e2c6b0f265',
    //     buyer: '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //     nftContract: '0x65e8d85dcb18bea857d6dc53a401ef847a544013ffd4dae14849008b4f1eb57b',
    //     nftId: 99n,
    //     priceToken: '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959',
    //     price: 88n,
    //     recipient: '0xEf73Eaa714dC9a58B0990c40a01F4C0573599959'
    //   }
    // }

    let configService = frameworkService.getService("ConfigService");
    let orderStatus = configService.getGlobalConfig("orderStatus");
    let whereJson = {
      maticOrderKey : log.args.orderKey,
      "status": {"$in": [orderStatus.status_onsale, orderStatus.status_canceling]}
    };
    let updateJson = {
      "$set" : {
        maticAddr: log.args.buyer,
        BuyOrderEvent: {
          orderKey: log.args.orderKey,
          buyer: log.args.buyer,
          nftContract: log.args.nftContract,
          nftId: log.args.nftId.toString(),

          priceToken: log.args.priceToken,
          price: log.args.price.toString(),
          recipient: log.args.recipient,
          timestamp: txTimestamp,
          txHash: log.transactionHash
        },
        timestamp: txTimestamp,
        maticBuyOrderTime: txTimestamp,
        maticBuyerBlockNumber: log.blockNumber
      }
    };

    let mongoService = frameworkService.getService("MongoDBService");
    let tblName = configService.getGlobalConfig("orderInfoTbl");
    await mongoService.updateOne(tblName, whereJson, updateJson);
  }

  async getLastestBlockNumber() {
    let blockNumber = await this.web3.eth.getBlockNumber();
    return blockNumber;
  }
};

