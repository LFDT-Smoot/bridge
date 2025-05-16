/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
const path = require('path');
const fs = require('fs');

global.testnet = true;
global.keystore = path.join(__dirname, "../keystore/");

global.argv = {};
global.argv.loglevel = 'debug';

global.moduleConfig = require('../conf/moduleConfig.js');

global.syncLogger = console;
global.monitorLogger = console;

const {
  hexTrip0x,
  loadConfig
} = require('../comm/lib');

let {
  syncChain
} = require("../chain/index.js");

global.config = loadConfig();

global.agentDict = require('../agent').agentDict;
let { creatEthAgentFork } = require('../agent');

const privateKey = process.env.PRIVATE_KEY;
process.env.PRIVATE_KEY = privateKey;

async function agent_sendNormalTrans_test(chainType) {
  if (!global.agentDict[chainType]) {
    global.agentDict[chainType] = creatEthAgentFork(chainType);

    global.moduleConfig.crossInfoDict[chainType] = global.moduleConfig.crossInfoDict['ETHMODEL'];
  }
  let agent = new global.agentDict[chainType]();
  agent.isLeader = true;
  agent.multiSignature = false;

  let account = agent.chain.getAccountFromPrivateKey(privateKey);
  console.log("account result is", account.address);

  let from = account.address;
  let to = account.address;
  let gas = agent.crossConf.gasLimit;
  let amount = 1000000000;

  to = '0xaA486ca50A0cb9c8d154ff7FfDcE071612550042';
  amount = 300000000000000;

  let transInfo = [from, to, gas, null, null, amount];
  agent.trans = new agent.RawTrans(...transInfo, agent.transChainID, agent.chainType);

  let gasPrice = await agent.getGasPrice();
  console.log("gasPrice result is", gasPrice);
  agent.trans.setGasPrice(gasPrice);

  let nonce = await agent.chain.getNonceSync(account.address);
  console.log("nonce result is", nonce);
  agent.trans.setNonce(nonce);

  agent.trans.setData("");
  agent.trans.setData("0x1efaecc50000000000000000000000000000000000000000000000000000000080000094000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000002043e964acb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000a8299deccd420d5b6970d611afb25cc8e91022100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a8299deccd420d5b6970d611afb25cc8e9102220000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b4372656174654f7264657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022300000000000000000000000000000000000000000000000000000000000000000000000000000000");

  console.log("********************************** sendTransaction get signature **********************************", agent.trans);
  let rawTx = await agent.trans.sign(Buffer.from(hexTrip0x(privateKey),'hex'));
  let result = await agent.chain.sendRawTransactionSync(rawTx);
  console.log("result is", result);
}

async function agent_syncTrans_test(chainType, logger, saveDb = false, syncFrom, syncTo, nodeUrl = '', address = '') {
  if (!global.agentDict[chainType]) {
    global.agentDict[chainType] = creatEthAgentFork(chainType);

    global.moduleConfig.crossInfoDict[chainType] = global.moduleConfig.crossInfoDict['ETHMODEL'];
  }
  if (nodeUrl && nodeUrl !== '') {
    global.config.crossTokens[chainType].CONF.nodeUrl = nodeUrl;
  }

  if (address && address !== '') {
    global.tokenList[chainType] = {
      crossScAddr: address
    }
  }

  await syncChain(chainType, logger, false, syncFrom, syncTo);
}

async function agent_test(record, chainType, action) {
  let agent = new global.agentDict[chainType](record);
  agent.isLeader = true;
  agent.multiSignature = true;
  // agent.setRecord(record);

  let account = agent.chain.getAccountFromPrivateKey(privateKey);
  console.log("account result is", account.address);

  let publicKey = agent.chain.getPublicKeyFromPrivateKey(privateKey);
  console.log("publicKey result is", publicKey);
  global.tokenList[chainType] = {
    pk: publicKey
  }

  try {
    await agent.initAgentTransInfo(action);
    await agent.createTrans(action);
  
    let result = await agent.sendTransSync();
    console.log("result is", result);
  } catch (err) {
    console.log("agent_test failed", err);
  }
}

async function sign_test(chainType, message) {
  if (!global.agentDict[chainType]) {
    global.agentDict[chainType] = creatEthAgentFork(chainType);

    global.moduleConfig.crossInfoDict[chainType] = global.moduleConfig.crossInfoDict['ETHMODEL'];
  }
  let agent = new global.agentDict[chainType]();

  let account = agent.chain.getAccountFromPrivateKey(privateKey);
  console.log("account result is", account.address);

  let publicKey = agent.chain.getPublicKeyFromPrivateKey(privateKey);
  console.log("publicKey result is", publicKey);
  global.tokenList[chainType] = {
    pk: publicKey
  }

  const ethUtil = require('ethereumjs-util');
  const messageHash = ethUtil.keccak256(message);

  let signature = await agent.signMessage(messageHash);
  console.log("signature result is", signature);

  let verify = agent.verifySignature(messageHash, signature.signature, account.address);
  console.log("verify signature result is", verify);

  let signData = await agent.prepareSignData(message);
  console.log("signData result is", signData);

  signData.signature = signData.signature.signature;
  let signatures = [signData, signData];
  let convertSignatureResult = agent.convertSignatures(signatures);
  console.log("convertSignatureResult is", convertSignatureResult);

  let encodedProof = agent.convertEncodeProof(convertSignatureResult);
  console.log("encodedProof result is", encodedProof);

  let taskId = '0x6c9d2d63f5921a89dd8d240f8b12beee6e8339f56dd1d9cb53a260d712fc13d3';
  let networkId = '2147484614';
  let contractAddress = '0xaA486ca50A0cb9c8d154ff7FfDcE071612550042';
  let functionCallData = '0x3e964acb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000a8299deccd420d5b6970d611afb25cc8e91022100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a8299deccd420d5b6970d611afb25cc8e9102220000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b4372656174654f7264657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e910223000000000000000000000000000000000000000000000000000000000000000000000000000000000000007b0a8299deccd420d5b6970d611afb25cc8e910220';
  let encodedInfo = agent.convertEncodeInfo(taskId, networkId, contractAddress, functionCallData);
  console.log("encodedInfo result is", encodedInfo);

  let decodeInfo = agent.decodeEncodeInfo(encodedInfo);
  console.log("decodeInfo result is", decodeInfo);
}

async function initConfig() {
  global.modelOps = require('../db');
  global.tokenList = {};
  global.tokenList.supportChains = ['MATIC', 'XLM'];
  global.secret = {};

  global.apiURL = process.env.apiUrl;

  global.originToken = {};
  global.moduleConfig = require('../conf/moduleConfig.js');
}

async function main() {
  try {
    initConfig();

    // await agent_sendNormalTrans_test('MATIC');

    await sign_test('MATIC', '0x1234');

    // await agent_syncTrans_test('MATIC', console, false, 9585705, 9585706, null, "0xaA486ca50A0cb9c8d154ff7FfDcE071612550042");
    // await agent_syncTrans_test('MATIC', console, false, 9623530, 9623539, null, "0xaA486ca50A0cb9c8d154ff7FfDcE071612550042");
    let record = {
      "hashX" : "0xcc2141338a48bf9f24d276c996d78849f004427dfe435b03bce38948ff360ba0",
        "actionChain" : "MATIC",
        "actionChainID" : 2147484614,
        "blockNumber" : 33477544,
        "crossAddress" : "0x77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1",
        "crossChain" : "MATIC",
        "crossChainID" : 2147484614,
        "crossMode" : "SINGLE",
        "direction" : 0,
        "extData" : "0x3e964acb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000a8299deccd420d5b6970d611afb25cc8e91022100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a8299deccd420d5b6970d611afb25cc8e9102220000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b4372656174654f7264657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e910223000000000000000000000000000000000000000000000000000000000000000000000000000000000000007b0a8299deccd420d5b6970d611afb25cc8e910220",
        "from" : "0x441bffbe26b819e51deb32aeadeb1f847f24d859",
        "isRelay" : true,
        "networkFee" : "0",
        "originChain" : "BSC",
        "originChainID" : 2147484362,
        "timestamp" : 1699940451000,
        "crossScAddr" : "0xaA486ca50A0cb9c8d154ff7FfDcE071612550042",
        "srcTransferEvent" : [
                {
                        "address" : "0x7280E3b8c686c68207aCb1A4D656b2FC8079c033",
                        "blockNumber" : 33477544,
                        "transactionHash" : "0x6170452fd7817732b58f4b1270531bbf73c11a853a50dd78b8d64fcbafdafa70",
                        "transactionIndex" : 86,
                        "blockHash" : "0x913444deadb2e833956744e91f1ba28251c82a595a8d803aecbafc3f7c749956",
                        "logIndex" : 178,
                        "removed" : false,
                        "id" : "log_88002d09",
                        "timestamp" : 1699940451,
                        "event" : "MessageDispatched",
                        "args" : {
                                "__length__" : 5,
                                "messageId" : "0xcc2141338a48bf9f24d276c996d78849f004427dfe435b03bce38948ff360ba0",
                                "from" : "0x441BfFBe26b819e51deB32AeAdeB1F847f24d859",
                                "toChainId" : "2153201998",
                                "to" : "0x727CC02aE85aF372141c0d51485867de99696e2c",
                                "data" : "0x00000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000a8299deccd420d5b6970d611afb25cc8e91022100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a8299deccd420d5b6970d611afb25cc8e9102220000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b4372656174654f7264657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e910223000000000000000000000000000000000000000000000000000000000000000000000000000000000000007b0a8299deccd420d5b6970d611afb25cc8e910220",
                                "xHash" : "0xcc2141338a48bf9f24d276c996d78849f004427dfe435b03bce38948ff360ba0"
                        },
                        "chainType" : "BSC",
                        "gasLimit" : "200000"
                }
        ],
    }
    // await agent_test(record, 'MATIC', 'relayTask');

  } catch (err) {
    console.log("err is", err);
  }
}

main();