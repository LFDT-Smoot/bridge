/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

class Context {
    constructor() {
        this.chainClassMap = {};
        this.agentClassMap = {};
        this.relayClassMap = {};
        this.privateKey = "";
    }

    setAgentClass(chainType, agentClass) {
        this.agentClassMap[chainType] = agentClass;
    }

    getAgent(chainType, record = null) {
        return new this.agentClassMap[chainType](record);
    }

    setRelayClass(chainType, relayClass) {
        this.relayClassMap[chainType] = relayClass;
    }

    getRelay(chainType) {
        if (global.moduleConfig.multiSignature) {
            return new this.relayClassMap[chainType](global.apiURL, global.multisigLogger);
        }
        //TODO: fix above hardcode
    }

    getAgentByChain(chainType) {
        //
    }

    setPrivateKey(privateKey) {
        this.privateKey = privateKey;
    }

    getPrivateKey() {
        return this.privateKey ||  process.env.PRIVATE_KEY;
    }

    setChainClass(chainType, chainClass) {
        this.chainClassMap[chainType] = chainClass;
    }

    getChain(chainType, logger = console, nodeUrl) {
        const cls = this.chainClassMap[chainType];
        if(cls) {
            return new cls(logger, nodeUrl, chainType);
        } else {
            throw new Error("Can not found chain class for chain:  " + chainType);
        }
    }
}

let context = new Context();

module.exports = context;