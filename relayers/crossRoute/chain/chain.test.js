/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
const path = require('path');
const fs = require('fs');

global.testnet = true;
const privateKey = process.env.PRIVATE_KEY;

global.syncLogger = console;

let {
  getChain,
  syncChain
} = require("./index.js");

async function matic_test() {
  let chain;
  let chainType = 'MATIC';
  let url = 'https://polygon-amoy.blockpi.network/v1/rpc/public';
  chain = getChain(chainType);
  chain = getChain(chainType, console, url);

  let gasPrice = await chain.getGasPriceSync();
  console.log("gasPrice result is", gasPrice);

  let account = chain.getAccountFromPrivateKey(privateKey);
  console.log("account result is", account);
  let publicKey = chain.getPublicKeyFromPrivateKey(privateKey);
  console.log("publicKey result is", publicKey);
  let address = chain.publicKeyToAddress(publicKey);
  console.log('address result is', address);

  await syncChainTest(chainType, console, 29108100, 29108103, url, '0x62dE27e16f6f31d9Aa5B02F4599Fc6E21B339e79');
  await syncChain(chainType, console, false, 29108100, 29108103);
}

async function stellar_test() {
  let chain;
  let chainType = 'XLM';

  await syncChainTest(chainType, console, 795974, 795976, '', "CAKSFWYLRLODMAZWRSOR4BWOM6V5IY2ZTHVSHD7BGULNDM65ROY65UTM");
}

function initConfig() {
  let configDir = __dirname;

  let configRelatePath = '../conf/config.json';
  const configPath = path.join(configDir, configRelatePath);
  let configJson = JSON.parse(fs.readFileSync(configPath));
  let config = global.testnet ? configJson.testnet : configJson.main;

  global.config = config;
  global.tokenList = {};
  global.moduleConfig = require('../conf/moduleConfig.js');
}

async function syncChainTest(chainType, logger, syncFrom, syncTo, nodeUrl, address) {

  global.tokenList[chainType] = {
    crossScAddr: address
  }
  if (nodeUrl && nodeUrl !== '') {
    global.config.crossTokens[chainType].CONF.nodeUrl = nodeUrl;
  }

  let chain = getChain(chainType, logger, global.config.crossTokens[chainType].CONF.nodeUrl);
  let event = await chain.getScEventSync(address, [], syncFrom, syncTo);
  logger.debug("event result is", event.length);
}

async function main() {
  try {
    initConfig();
    global.moduleConfig.promiseTimeout = 60 * 1000;

    // await matic_test();
    await stellar_test();
  } catch (err) {
    console.log("err is", err);
  }
}

main();
