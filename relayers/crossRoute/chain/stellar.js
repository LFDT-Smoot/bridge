/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const TimeoutPromise = require('../utils/timeoutPromise')

const abstract_base_chain = require("./chain_abstract");

const sorobanClient = require('../utils/stellar/client_soroban')
const HorizonClient = require("../utils/stellar/client_horizon");
const stellarUtils = require("../utils/stellar/utils");

const {eventParser, get_events_data_by} = require("../utils/stellar/tx_event_parser");
const {hexTrip0x, hexToAscii} = require("../comm/lib");

let g_stellar_client = null;


const soroban_testUrl = "https://soroban-testnet.stellar.org:443" //TODO: read from configure file


class StellarChain extends abstract_base_chain {

  constructor(log, nodeUrl, chainType = null) {
    super(log, nodeUrl, chainType);
    sorobanClient.initRpcClient(soroban_testUrl);
  }

  getGasPriceSync() {
    return 0;
  }

  getNonceSync(address) {
    this.log.error("Stellar chain getNonceSync() Don't support nonce!")
    return 0;
  }

  getNonceIncludePendingSync(address) {
    this.log.error("Stellar chain getNonceSync() Don't support nonce!")
    return 0;
  }


  getClient(nodeUrl) {
    this.log.info(`Stellar chain getClient(${nodeUrl}) ...`);
    if(!g_stellar_client) {
      g_stellar_client = new HorizonClient(nodeUrl, this.log);
    }
    return g_stellar_client;    
  }

  async getScEventSync(scAddress, topics, fromBlk = 0, toBlk = 'latest') {
    
    this.log.info(`StellarChain getScEventSync(address=${scAddress},fromBlk=${fromBlk}, toblk=${toBlk}) `);

    const that = this;

    let scanOneBlock = async function (blockNum) {
      try {
        // console.log("this: ", that);
        const txs = await that.client.getTxsInLedger(blockNum);
        const foundEvents = [];
        txs.forEach(function (tx) {
          const txHash = tx.hash;
          const txDate = tx.created_at;
          let txSeconds = Math.floor((new Date(txDate)).getTime() / 1000);

          const txEvents = eventParser(tx.result_meta_xdr);
          const resultEvents = get_events_data_by(txEvents, scAddress, ["OutboundTaskExecuted", "InboundTaskExecuted"]);
          resultEvents.forEach(function (event) {
            event.blockNumber = blockNum;
            if(!txSeconds) {
              that.log.warn("Stellar found transaction that do not have timestamp. txHash: ", txHash);
              let timestamp = Date.now();
              txSeconds = parseInt(timestamp / 1000);
            }
            event.timestamp = txSeconds;
            event.address = scAddress;
            event.transactionHash = txHash;
          })
          foundEvents.push(...resultEvents);
        })
        return foundEvents;

      } catch (e) {
        that.log.error(`StellarChain getScEventSync() scanOneBlock(blockNum=${blockNum}) catch error : `, e);
        throw e;
      }
    }

    if (toBlk === 'last') {
      toBlk =  this.client.getLastLedgerSequence();
    }

    let batchPromises = []
    for (let i = fromBlk; i < toBlk; i++) {
      const scanOneBlockPromise = new TimeoutPromise(scanOneBlock(i), 150 * 1000, "StellarChain scanning one block timeout.")
      batchPromises.push(scanOneBlockPromise);
    }

    const batchResults = await Promise.all(batchPromises);
    let scannedTxs = [].concat.apply([], batchResults)  // flattern multiple arrays into one.

    this.log.info("StellarChain::getScEventSync() Done. scannedTxs length: ", scannedTxs.length);

    return scannedTxs;
  }

  getBlockNumberSync() {
    return this.client.getLastLedgerSequence();
  }

  sendRawTransaction(signedTx, callback) {
    try {
      const retQ = this.sendRawTransactionSync(signedTx);
      retQ.then( result => callback(null, result)).catch(e => callback(e, null));
    } catch (e) {
      this.log.error("sendRawTransaction", e)
      throw e
    }
  }

  sendRawTransactionSync(signedTx, retryTimes = 3) {
    return sorobanClient.txSend(signedTx, this.log)
  }

  // getTxInfo(txHash, callback) {
  //   throw new Error("NOT IMPLEMENTED");
  // }

  // getBlockByNumber(blockNumber, callback) {
  //   throw new Error("NOT IMPLEMENTED");
  // }

  // getBlockByNumberSync(blockNumber) {
  //   throw new Error("NOT IMPLEMENTED");
  // }

  getTransactionConfirmSync(txHash, waitBlocks, block_num) {
    const bSuccess = this.client.getTransactionStatus(txHash)
    return bSuccess ? {
      status: "0x1",
      txHash: txHash,
    } : null;
  }

    /**
     *
     * @param txHash
     * @param callback:  of function(err, result) signature.
     */
  getTransactionReceipt(txHash, callback) {
    try {
      this.client.getTransactionByTxHash(txHash).then(txInfo => {
        log.debug(`==> stellar-chain getTransactionReceipt() for txHash: ${txHash} got status: `, txInfo.successful);

        if(txInfo.successful) {
          const receipt = {
            status: "0x1",
            blockNumber: txInfo.ledger,
          }
          callback(null, receipt);
        }else {
          callback(null, null);
        }
      }).catch( err => {
        log.error(`==> stellar-chain getTransactionReceipt() --1-- for txHash: ${txHash} catch error: `, err);
        callback(err, null);
      });
    } catch (err) {
      log.error(`==> stellar-chain getTransactionReceipt() --2-- for txHash: ${txHash} catch error: `, err);
      callback(err, null);
    }
  }

  // getTransactionReceiptSync(txHash) {
  //   throw new Error("NOT IMPLEMENTED");
  // }


  /**
   *  Convert ascii-encoded address to stellar address. Call by getDecodeEventDbData() in Base agent.
   * @param {*} asciiEncode 
   */
  parseAddress(encodedAddress) {
    const ret = hexToAscii(hexTrip0x(encodedAddress));
    return ret;
  }

  async isValidAddress(address) {   // Call by getDecodeEventDbData() in Base agent.
    let bValid = true;
    const CORRECT_LEN = 56;
    try {
      bValid = address.length == CORRECT_LEN;
    }catch (e) {
      this.log.error("Stellar chain, invalid address: ", address);
    }
    return bValid;
  }

  getTokenInfo(tokenScAddr, tokenCrossType) {
    throw new Error("NOT IMPLEMENTED");
  }

  encodeTopic(type, param) {
    throw new Error("NOT IMPLEMENTED");
  }

  getAccountFromPrivateKey(privateKey) {
    return stellarUtils.getAccountFromPrivateKey(privateKey);
  }

  getPublicKeyFromPrivateKey(privateKey) {
    return stellarUtils.getPublicKeyFromPrivateKey(privateKey);
  }

}

module.exports = StellarChain;
