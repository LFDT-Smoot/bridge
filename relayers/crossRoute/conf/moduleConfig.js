/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var user = process.env.MONGO_USER;
var pwd = process.env.MONGO_PWD;

if (global.argv && global.argv.dbuser) {
  user = global.argv.dbuser;
  pwd = global.secret['MONGO_PWD'];
}

let dbUrl;
if (!global.dbPort) {
  global.dbPort = 27017
}
if(user) {
  dbUrl = `mongodb://${user}:${pwd}@localhost:27017`;
  if (global.dbIp) {
    dbUrl = `mongodb://${user}:${pwd}@${global.dbIp}:${global.dbPort}`;
  }
} else {
  dbUrl = `mongodb://localhost:27017`;
  dbUrl = `mongodb://127.0.0.1:27017`;
  if (global.dbIp) {
    dbUrl = `mongodb://${global.dbIp}:${global.dbPort}`;
  }
}

const testnet = global.testnet;

const commonFunction = {
  Relay: {
    src: ['outboundCall'],
    dest: ['inboundCall']
  }
}

const commonEvent = {
  Relay: {
    src: ['OutboundTaskExecuted'],
    dest: ['InboundTaskExecuted']
  }
}

const config = {
  crossDbUrl: dbUrl + "/cc",

  multiSignature: true,

  network: !testnet ? 'mainnet' : 'testnet',

  web3RetryTimes: 2,
  promiseTimeout: 160 * 1000,

  chainMaxFailures: 5,
  chainMaxFailureRecords: 20,

  retryTimes: 80,
  retryWaitTime: 5 * 1000,
  confirmTimes: 30,

  SAFE_BLOCK_NUM: 100,
  CONFIRM_BLOCK_NUM: 12,
  TRACE_BLOCK_NUM: 100000,
  SYNC_INTERVAL_BLOCK_NUM: 2000,
  SYNC_INTERVAL_TIME: 5 * 1000,
  INTERVAL_TIME: 10 * 1000,

  maxGasLimit: 8000000, /* for message cross, set maxGasLimit*/

  crossInfoDict: {
    MATIC: {
      CONF: {
        SAFE_BLOCK_NUM: 0,
        CONFIRM_BLOCK_NUM: 128,
        SYNC_INTERVAL_TIME: 60 * 1000,
        SYNC_INTERVAL_BLOCK_NUM: 500,
        TRACE_BLOCK_NUM: 300000,
        curveID: 1
      },
      CONTRACT: {

      },
      FUNCTION: commonFunction,
      EVENT: commonEvent
    }
  }
};

const test_Config = {
  crossDbUrl: dbUrl + "/cc_test",
  
  multiSignature: true,

  network: !testnet ? 'mainnet' : 'testnet',

  web3RetryTimes: 2,
  promiseTimeout: 300 * 1000,

  chainMaxFailures: 5,
  chainMaxFailureRecords: 20,

  retryTimes: 60,
  retryWaitTime: 3 * 1000,
  confirmTimes: 30,

  SAFE_BLOCK_NUM: 2,
  CONFIRM_BLOCK_NUM: 2,
  TRACE_BLOCK_NUM: 100000,
  SYNC_INTERVAL_BLOCK_NUM: 2000,
  SYNC_INTERVAL_TIME: 10 * 1000,
  INTERVAL_TIME: 10 * 1000,

  maxGasLimit: 8000000, /* for message cross, set maxGasLimit*/

  crossInfoDict: {
    ETHMODEL: {
      CONF: {
        curveID: 1
      },
      CONTRACT: {
        gatewayAddr: '0x0000000000000000000000000000000000000000',
        gatewayAbi: require('../abi/wmb.stellar.abi.json')
      },
      FUNCTION: commonFunction,
      EVENT: commonEvent
    },
    MATIC: {
      CONF: {
        SAFE_BLOCK_NUM: 0,
        CONFIRM_BLOCK_NUM: 128,
        SYNC_INTERVAL_BLOCK_NUM: 500,
        SYNC_INTERVAL_TIME: 40 * 1000,
        curveID: 1
      },
      CONTRACT: {
        gatewayAddr: '0xaA486ca50A0cb9c8d154ff7FfDcE071612550042',
        gatewayAbi: require('../abi/wmb.stellar.abi.json')
      },
      OPER_CONTRACT: {
        "0x77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1": {
          abi: require('../abi/nftMarket.abi.json'),
          function: 'wmbReceive'
        }
      },
      FUNCTION: commonFunction,
      EVENT: commonEvent
    },
    XLM: {
      CONF: {
        SAFE_BLOCK_NUM: 1,
        // TRACE_BLOCK_NUM: 20000,
        TRACE_BLOCK_NUM: 1500,
        CONFIRM_BLOCK_NUM: 1,
        SYNC_INTERVAL_BLOCK_NUM: 20, // in one minute, new generate blocks is around 12 .
        SYNC_INTERVAL_TIME: 60 * 1000,  // call sync every 3 mionute
        curveID: 1
      },
      CONTRACT: {
        gatewayAddr: 'CB6IPBQO27IMYHQNDONI7XKHVM6CJ7LIVW4RY65ULFGD5AIT6CTSTRRV',
      },
      FUNCTION: commonFunction,
      EVENT: commonEvent
    }
  }
};

module.exports = testnet?test_Config:config;
