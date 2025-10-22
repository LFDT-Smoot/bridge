/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const context = require("./index.js");

const ksTool = require("../utils/keyStore");

const EthBaseChain = require("@modules/chain/evm/ethBase.js");
const StellarChain = require("@modules/chain/stellar/stellar.js");

const MultiSig = require('@modules/relay/multiSig');
const EthAgentModel = require("@modules/chain/evm/EthAgentModel.js");
const StellarAgent = require("@modules/chain/stellar/StellarAgent.js")

const MaticGateWayConverter = require('@modules/chain/evm/convert/index.js')
const StellarGateWayConverter = require('@modules/chain/stellar/convert/index.js')

const Stellar_NftMarketConverter  = require('@modules/converter/nftMarket/stellar/index.js');
const Matic_NftMarketConverter  = require('@modules/converter/nftMarket/evm/index.js');

// Import WmbApp configuration from standalone config file
const { WmbAppLookupTable } = require('./wmbAppConfig.js');


const WmbConverterManager = require("./WmbConverterManager.js")

const wmbConverterManager = new WmbConverterManager(WmbAppLookupTable);

wmbConverterManager.setWmbGateConverter("MATIC", new MaticGateWayConverter("MATIC"));
wmbConverterManager.setWmbGateConverter("XLM", new StellarGateWayConverter("XLM"));

wmbConverterManager.setWmbAppConverter("MATIC", "NftMarket", new Matic_NftMarketConverter("MATIC"));
wmbConverterManager.setWmbAppConverter("XLM", "NftMarket", new Stellar_NftMarketConverter("XLM"));


// exports.convertDict = convertDict;
global.wmbConverterMgr = wmbConverterManager;

const privateKey = ksTool.getPrivateKey(global.agentAddr, global.secret["WORKING_PWD"]);
context.setPrivateKey(privateKey);

function creatEthAgentFork(chainType) {
  class EthAgentModelTemp extends EthAgentModel {
    constructor(record = null) {
      super(record, chainType);
    }
  }
  return EthAgentModelTemp;
}

// const agentDict = {
//   MATIC: creatEthAgentFork('MATIC'),
//   XLM: StellarAgent,
// };

context.setAgentClass("MATIC", creatEthAgentFork('MATIC'));
context.setAgentClass("XLM", StellarAgent);

context.setChainClass("MATIC", EthBaseChain);
context.setChainClass("XLM", StellarChain);

context.setRelayClass("MATIC", MultiSig);
context.setRelayClass("XLM", MultiSig);

