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


// You can fill in any contract address that can identify a WmbApp
const WmbAppAssociatedScAddress = {
  "MATIC": {
    "NftMarket" : [
      "CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
      "0x4344344a474c4d32434c56493642364c51345a575932585350474336535535504a485658414855544c324d524834475445324a585533364f", // hex encode of previous address!
      "0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2"]  // need to change to real WmbApp contract address
  },
  "XLM": {
    "NftMarket" : [
      "CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
      "0x4344344a474c4d32434c56493642364c51345a575932585350474336535535504a485658414855544c324d524834475445324a585533364f", // hex encode of previous address!
      "0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2"]  // need to change to real WmbApp contract address
  },
}


const WmbConverterManager = require("./WmbConverterManager.js")

const wmbConverterManager = new WmbConverterManager(WmbAppAssociatedScAddress);

wmbConverterManager.setWmbGateConverter("MATIC", new MaticGateWayConverter("MATIC"));
wmbConverterManager.setWmbGateConverter("XLM", new StellarGateWayConverter("XLM"));

wmbConverterManager.setWmbAppConverter("MATIC", "NftMarket", new Matic_NftMarketConverter("MATIC"));
wmbConverterManager.setWmbAppConverter("XLM", "NftMarket", new Stellar_NftMarketConverter("XLM"));


// exports.convertDict = convertDict;
global.wmbConverterMgr = wmbConverterManager;


const ret = wmbConverterManager.getWmbAppConverterByScAddress("XLM", "b9b35117b4d0124c893f9505f5a3c9e69144a3e2");
console.log("TEST found result: ", ret);

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

