/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const axios = require('axios');
const parseUrl = require('parse-url');
const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");


const TimeoutPromise = require('@framework/utils/timeoutPromise.js')

const URL_MAP = {
   MAIN_NET : "https://horizon.stellar.org/",
   TEST_NET : "https://horizon-testnet.stellar.org/"
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let ReqApiObj = {
    LEDGERS:'ledgers',
    TRANSACTIONS:'transactions',
    ACCOUNTS:'accounts',
    ASSETS:'assets',
    PAYMENTS:'payments',
}


class tempLogger {
    debug(...params){
        console.log(...params)
    }
    error(...params){
        console.log(...params)
    }
    info(...params) {
        console.log(...params)
    }
    warn(...params) {
        console.log(...params)
    }
}

let g_req_counters = 0;

let g_wait_for_ratelimie_reset = false;

class HorizonClient {

    constructor(nodeUrl, logger){
        if(nodeUrl){
            this.nodeUrl = nodeUrl;
        }else{
            this.nodeUrl = URL_MAP.TEST_NET;
        }

        if(logger){
            this.logger = logger
        }else{
            this.logger = new tempLogger();
        }
    }

    async execRequest(config, hintMsg = ""){
        try{
            g_req_counters++;

            if(g_wait_for_ratelimie_reset) {
                throw new Error("In rate limit state, please try later!")
            }

            let reqPromise = axios(config);
            const configuredTimeout = global.moduleConfig ? global.moduleConfig.promiseTimeout : undefined;
            const reqPromiseWithTimeout = new TimeoutPromise(reqPromise,  configuredTimeout || 30*1000, "PTIMEOUT: " + hintMsg);
            const resp = await reqPromiseWithTimeout;
            return resp;
        }catch (e) {
            // this.logger.info("horizon client catch error:", e);
            let errMsg = {
                "requestContext": hintMsg,
            };
            if(typeof e === 'string') {
                errMsg["error"] = e;
            }else{
                errMsg["errorCode"] = e.code;
                errMsg["status"] = e.status;
            }

            if(e.status == 429 || (e.response && e.response.statusText == 'Too Many Requests') ) {
                this.logger.info("================>>>>>>>>>>>>>   horizon client catch 429 error! ================>>>>>>>>>>>>>  ");
                errMsg["data"] = e.response.data;

                this.logger.error(" RATE LIMIT happen! Horizon url: " + config.url,  "Sum up send request times: ", g_req_counters);
                g_wait_for_ratelimie_reset = true;

                const seconds_to_wait_default = 5*60;
                let seconds_to_wait = seconds_to_wait_default;
                try{
                    seconds_to_wait = e.response.headers['x-ratelimit-reset'];
                    this.logger.info("Request horizon  seconds_to_wait: ", seconds_to_wait);
                }catch (e) {
                    seconds_to_wait = seconds_to_wait_default;
                    this.logger.info("Request horizon  seconds_to_wait default: ", seconds_to_wait_default);
                }
                setTimeout(()=> {g_wait_for_ratelimie_reset = false}, seconds_to_wait * 1000);
            }
            throw new Error(JSON.stringify(errMsg, null, 2));
        }

    }

    async getLastLedgerSequence(){
        let url = this.nodeUrl + ReqApiObj.LEDGERS;
        try{
            let config = {
                method: 'get',
                url: url,
                params: {
                    cursor:"",
                    order : 'desc',
                    limit : 1
                },
                headers: {
                    'Accept': 'application/json'
                },
            }
            let resp = await this.execRequest(config, `HorizonClient::getLastLedgerSequence()`);

            // this.logger.debug('resp.data: ', resp.data);

            let data = resp.data;
            let ledger = data._embedded.records[0];
            // this.logger.debug('ledger: ', ledger);

            return ledger.sequence
        }catch (e) {
            throw (e)
        }
    }

    async getTxsInLedger(sequence){
        let url = this.nodeUrl + ReqApiObj.LEDGERS + '/' + sequence + '/' + ReqApiObj.TRANSACTIONS;
        let cursor = 0;
        const NumPerReq = 50;
        let config = {
            method: 'get',
            url: url,
            params: {
                cursor:cursor,
                order : 'asc',
                limit : NumPerReq,
                include_failed:false
            },
            headers: {
                'Accept': 'application/json'
            },
        }

        try{
            let allTxs = [];
            do {
                let resp = await this.execRequest(config, `HorizonClient::getTxsInLedger(${sequence})`);
                let data = resp.data;
                // console.log('data: ', data);

                if(!data || !data._embedded || data._embedded.records.length == 0) {
                    break;
                }

                let records = data._embedded.records;
                allTxs.push(...records);

                let netLinkObj = parseUrl(data._links.next.href);
                cursor = netLinkObj.query.cursor;
                config.params.cursor = cursor;

                // if all Txs has been read out, break out.
                if(records.length < NumPerReq) { // this means all Txs has been read out.
                    break;
                }
            }while (true);
            return allTxs;
        }catch (e) {
            throw(e)
        }
    }

    async getPaymentsInLedger(sequence){
        let url = this.nodeUrl + ReqApiObj.LEDGERS + '/' + sequence + '/' + ReqApiObj.PAYMENTS;
        let cursor = 0;
        const NumPerReq = 50;        
        let config = {
            method: 'get',
            url: url,
            maxBodyLength: Infinity,
            params: {
                cursor:cursor,
                order : 'asc',
                limit : NumPerReq,
                include_failed:false
            },
            headers: {
                'Accept': 'application/json'
            },
        }

        try{
            let allPaymentss = [];            
            do {
                let resp = await this.execRequest(config, `HorizonClient::getPaymentsInLedger(${sequence})`); 
                let data = resp.data;
                // console.log('data: ', data);

                if(!data || !data._embedded || data._embedded.records.length == 0) {
                    break;
                }

                let records = data._embedded.records;

                allPaymentss.push(...records);

                let netLinkObj = parseUrl(data._links.next.href);
                config.params.cursor = netLinkObj.query.cursor;

                // if all Txs has been read out, break out.
                if(records.length < NumPerReq) { // this means all Txs has been read out.
                    break;
                }

            }while (true);

            return allPaymentss;

        }catch (e) {
            throw(e)
        }
    }

    async getAccountObjOnChain(accountPubkey){
        let accountOnChain = await this.getAccountbyID(accountPubkey);
        let sequence = accountOnChain.sequence;
        let Account = new StellarSdk.Account(accountPubkey, sequence);
        return Account;
    }

    /**
     * 
     * @param {*} account_id : This account’s public key encoded in a base32 string representation. i.e the address you see on browser.
     * @returns 
     */
    async getAccountbyID(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getAccountbyID(${account_id})`); 
            return resp.data;
        }
        catch (e) {
            throw e;
        }
    }

    async getBalanceOfXLM(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getBalanceOfXLM(${account_id})`); 
            const data = resp.data();
            if(data && data.balances){
                const nativeBalance = data.balances.filter(obj => obj.asset_type === 'native');

                if(nativeBalance.length == 1) {
                    return nativeBalance[0].balance;
                }else{
                    throw new Error(`Invalid account: ${account_id} that has incorrect native balance`);
                }
            }
            throw new Error(`Failed to find account of ${account_id}`);
        }
        catch (e) {
            throw e;
        }
    }

    async getBalanceOfAsset(account_id, asset_code, asset_issuer){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getBalanceOfAsset(${account_id}, ${asset_code}, ${asset_issuer})`); 
            const data = resp.data();
            if(data && data.balances){
                const nativeBalance = data.balances.filter(o => o.asset_code === asset_code && o.asset_issuer == asset_issuer);

                if(nativeBalance.length == 1) {
                    return nativeBalance[0].balance;
                }else{
                    this.logger.debug(`getBalanceOfAsset() no asset '${asset_code}.${asset_issuer}' on account ${account_id}`);
                    return 0;
                }
            }
            throw new Error(`getBalanceOfAsset() Failed to find account of ${account_id}`);
        }
        catch (e) {
            throw e;
        }
    }
    async getAllBalance(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getAllBalance(${account_id})`);
            if(resp && resp.data && resp.data.balances){
                return resp.data.balances;
            }
        }
        catch (e) {
            throw e;
        }
    }


    async sendSignedTx(tx){
        let url = this.nodeUrl + ReqApiObj.TRANSACTIONS ;
        let config = {
            method: 'post',
            url: url,
            headers: {
                'Accept': 'application/json'
            },
            params:{
                tx: tx
            },
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::sendSignedTx()`);
            if(resp && resp.data ){
                this.logger.debug('data: ', resp.data)
            }
            return resp.data;

        }
        catch (e) {
            throw e;
        }
    }

    async getAllAssets(){
        let url = this.nodeUrl + ReqApiObj.ASSETS;

        let config = {
            method: 'get',
            url: url,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getAssets()`);    
            console.log("getAllAssets(): ", resp.data);
            return resp.data;
        }
        catch (e) {
            throw e;
        }
    }

    async getTransactionByTxHash(transaction_hash){
        let url = this.nodeUrl + ReqApiObj.TRANSACTIONS + '/' + transaction_hash
        let config = {
            method: 'get',
            url: url,
            maxBodyLength: Infinity,
            headers: {
                'Accept': 'application/json'
            },
        };
        try{
            let resp = await this.execRequest(config, `HorizonClient::getTransactionByTxHash(${transaction_hash})`);               
            return resp.data;
        }
        catch (e) {
            throw e;
        }
    }

    // Fetch transaction details
    async getTransactionDetails(txHash) {

        const url = 'https://soroban-testnet.stellar.org'; // Define URL separately

        // Construct the config object for axios(config)
        let config = {
            method: 'post', // Since it's a POST request
            url: url,
            headers: {
                'Content-Type': 'application/json', // Set the Content-Type header
                'Accept': 'application/json' // Good practice to include Accept header for JSON APIs
            },
            // For POST/PUT/PATCH requests, the data/body goes under the 'data' property
            data: {
                jsonrpc: "2.0",
                id: Date.now(), // Using current timestamp as a unique ID
                method: "getTransaction",
                params: {
                    hash: txHash
                }
            }
        };

        try {
            const response = await this.execRequest(config, `HorizonClient::getTransactionByTxHashV2(${txHash})`);
            return response.data.result;
        } catch (e) {
            throw e;
        }
    }


    async getTransactionStatus(transaction_hash){
        try{
            let data = await this.getTransactionByTxHash(transaction_hash);
            return data.successful
        }catch(e){
            throw e;
        }

    }

    async feeStats(){
        try{
            let url = this.nodeUrl + 'fee_stats';
            let config = {
                method: 'get',
                url: url,
                maxBodyLength: Infinity,
                headers: {
                    'Accept': 'application/json'
                },
            }

            let resp = await this.execRequest(config, `HorizonClient::fee_stats()`);  
            return resp.data;
        }
        catch (e) {
            throw e;
        }
    }
}

module.exports = HorizonClient;
