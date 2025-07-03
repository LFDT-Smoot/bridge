/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

class abstract_base_agent {
    constructor(record, chainType, logger) {
        this.chainType = chainType;
        this.logger = logger;
        this.agentWorkerWallet = null;
        this.RawTrans = null;
        this.relay = null;
        this.record = record;
    }

    async getCrossMessageTask(fromBlock, toBlock) {
        throw new Error("getCrossMessageTask Not implemented");
    }

    // return the latest block number
    async getBlockNumberSync() {
        throw new Error("getBlockNumberSync() Not implemented");
    }

    // init the transaction data, for example, nonce, gasLimit etc
    async initAgentTransInfo(action) {
    }

    /**
     * gather the data that will be pass to relay proof.
     *
     * @returns {Promise<void>}  return the data of {uniquiuId, rawData, extData} format.
     */
    async getDataForRelayProof(){
        // return {uniquiuId, rawData, extData}
        throw new Error("getDataForRelayProof Not implemented");
    }

    // flower-node verify the relay proofData, return true if verified, else return false
    async checkRelayData(relayData){
        throw new Error("checkRelayData() Not implemented");
    }

    // leader-node save signature result
    setProof(proof) {
        this.proof = proof;
    }

    // create transaction and sign it
    async createTrans(action) {
        throw new Error("createTrans Not implemented");
    }
    // send transaction onto chain
    async sendTransSync() {
        throw new Error("sendTransSync Not implemented");
    }
    // check if transaction has be confirmed on chain
    async getTransactionConfirmSync(txHash, confirm_block_num) {
        throw new Error("getTransactionConfirmSync Not implemented");
    }

}

module.exports = abstract_base_agent;