/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
if (!global.moduleConfig) {
  global.moduleConfig = require('../conf/moduleConfig.js');
}
const abstract_base_chain = require("./chain_abstract.js");

const TimeoutPromise = require('../utils/timeoutPromise.js')
const Web3 = require("web3");

const elliptic = require('elliptic');
const ethUtil = require('ethereumjs-util');

const net = require('net');

const {
  hexAdd0x,
  sleep
} = require('../comm/lib');

class EthBaseChain extends abstract_base_chain{
  constructor(log, nodeUrl, chainType = null) {
      super(log, nodeUrl, chainType);
  }

  encodeTopic(type, param) {
    const web3 = new Web3();
    return '0x' + web3.eth.abi.encodeParameters(type, param);
  }

  getClient(nodeUrl) {
    if (!nodeUrl) {
      if (!global.config || !global.config.crossTokens || !global.config.crossTokens[this.chainType] || !global.config.crossTokens[this.chainType].CONF || !global.config.crossTokens[this.chainType].CONF.nodeUrl) {
        return null;
      } else {
        nodeUrl = global.config.crossTokens[this.chainType].CONF.nodeUrl;
      }
    }
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      return new Web3(new Web3.providers.HttpProvider(nodeUrl));
    } else {
      return new Web3(new Web3.providers.IpcProvider(nodeUrl, net));
    }
  }

  getGasPriceSync() {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let gasPrice = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getGasPrice(function(err, result) {
          if (err) {
            reject(err);
          } else {
            gasPrice = result;
            log.debug("ChainType:", chainType, 'getGasPriceSync ', gasPrice, ' successfully');
            resolve(gasPrice);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getGasPriceSync timeout');
  }

  getNonceSync(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getTransactionCount(address.toLowerCase(), function(err, result) {
          if (err) {
            reject(err);
          } else {
            nonce = '0x' + result.toString(16);
            log.debug("ChainType:", chainType, 'getNonceSync ', result, nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNonceSync timeout');
  }

  getNonceIncludePendingSync(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        let optional = 'pending';

        client.eth.getTransactionCount(address.toLowerCase(), optional, function(err, result) {
          if (err) {
            log.error("ChainType:", chainType, 'getNonceIncludePendingSync failed on address ', address, err);
            reject(chainType + ' ' + (err.hasOwnProperty("message") ? err.message : err));
          } else {
            nonce = '0x' + result.toString(16);
            log.debug("ChainType:", chainType, 'getNonceIncludePendingSync ', result, nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        log.error("ChainType:", chainType, 'getNonceIncludePendingSync failed on address ', address, err);
        reject(chainType + ' ' + (err.hasOwnProperty("message") ? err.message : err));
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNonceIncludePendingSync timeout');
  }

  getScEventSync(address, topics, fromBlk = 0, toBlk = 'latest') {
    let client = this.client;
    let baseChain = this;
    let chainType = this.chainType;

    return new TimeoutPromise(async function (resolve, reject) {
      let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address.toLowerCase()
      };

      try {
        let result = await client.eth.getPastLogs(filterValue);
        resolve(result);
      } catch (err) {
        baseChain.log.error("ChainType:", chainType, "getScEventSync", err);
        reject((err.hasOwnProperty("message") ? err.message : err));
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getScEventSync timeout');
  }

  getBlockNumberSync() {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBlockNumber(function (err, blockNumber) {
          if (err) {
            reject(err);
          } else {
            log.debug("ChainType:", chainType, 'getBlockNumberSync successfully with result: ', blockNumber);
            resolve(blockNumber);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockNumberSync timeout');
  }

  sendRawTransactionSync(signedTx) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        log.debug("======================================== sendRawTransaction ====================================", chainType)
        self.client.eth.sendSignedTransaction(signedTx)
          .on('transactionHash', function (hash) {
            log.debug("ChainType:", chainType, "Transaction hash:", hash);
            resolve(hash);
          })
          // .on('receipt', function (receipt) {
          //   if (receipt.status) {
          //     log.debug("ChainType:", chainType, 'Transaction successful:', receipt);
          //     resolve(receipt);
          //   } else {
          //     log.error("ChainType:", chainType, "Transaction failed:", receipt);
          //     resolve(receipt);
          //   }
          // })
          .on('error', function (error) {
            log.error("ChainType:", chainType, "sendRawTransactionSync error: ", error);
            reject(error);
          });
      } catch (err) {
        log.error("ChainType:", chainType, "sendRawTransactionSync error: ", err);
        reject((err.hasOwnProperty("message") ? err.message : err));
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' sendRawTransactionSync timeout');
  }

  getTxInfo(txHash, callback) {
    this.client.eth.getTransaction(txHash, callback);
  }

  getBlockByNumber(blockNumber, callback) {
    this.client.eth.getBlock(blockNumber, callback);
  }

  getBlockByNumberSync(blockNumber) {
    // let log = this.log;
    let self = this;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        self.getBlockByNumber(blockNumber, function (err, result) {
          if (err) {
            reject(err);
          } else {
            // log.debug("ChainType:", chainType, 'getBlockByNumberSync successfully with result: ', result);
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockByNumberSync timeout');
  }

  getTransactionConfirmSync(txHash, waitBlocks) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let receipt = null;
    let curBlockNum = 0;
    let sleepTime = 10;
    let exitCondition = { exist: false };

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        receipt = await self.getTransactionReceiptSync(txHash);
        // if (receipt === null) {
        //   resolve(receipt);
        //   return;
        // }
        while (receipt === null && exitCondition && !exitCondition.exist) {
          await sleep(sleepTime * 1000);
          receipt = await self.getTransactionReceiptSync(txHash);
        }

        curBlockNum = await self.getBlockNumberSync();
        let receiptBlockNumber = receipt.blockNumber;

        while (receiptBlockNumber + waitBlocks > curBlockNum && exitCondition && !exitCondition.exist) {
          log.debug("ChainType:", chainType, "getTransactionReceipt was called at txHash: ", txHash, " at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
          await sleep(sleepTime * 1000);
          receipt = await self.getTransactionReceiptSync(txHash);
          curBlockNum = await self.getBlockNumberSync();
          receiptBlockNumber = receipt.blockNumber;
        }
        resolve(receipt);
      } catch (err) {
        log.error("getTransactionConfirmSync", err);
        resolve(null);
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionConfirmSync timeout', exitCondition)
  }

  getTransactionReceipt(txHash, callback) {
    this.client.eth.getTransactionReceipt(txHash, callback);
  }

  getTransactionReceiptSync(txHash) {
    let chainType = this.chainType;
    let self = this;

    return new TimeoutPromise(function (resolve, reject) {
      console.log(self.nodeUrl, txHash);
      self.getTransactionReceipt(txHash, function (err, result) {
        if (err) {
          reject(err);
        } else {

          resolve(result);
        }
      });
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionReceiptSync timeout')
  }

  getSolInterface(abi, contractAddr, contractFunc) {
    let contract = new this.client.eth.Contract(abi, contractAddr);
    return contract.methods[contractFunc];
  }

  async callSolInterface(contractAbi, contractAddr, contractFunc, ...params) {
    let self = this;

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterface(contractAbi, contractAddr, contractFunc);
      func(...params).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    }, global.moduleConfig.promiseTimeout, "ChainType: " + self.chainType + contractFunc + ' timeout');
  }


  async getSolVar(abi, contractAddr, varName) {
    let contract = this.client.eth.Contract(abi, contractAddr);
    return await contract.methods[varName]().call();
  }

  getTokenInfo(tokenScAddr, tokenCrossType) {
    let log = this.log;
    let self = this;
    let chainType = this.chainType;

    let token = {};
    token.tokenType = "TOKEN";

    let tokenAbi;
    if (tokenCrossType === global.moduleConfig.tokenCrossType.ERC20) {
      tokenAbi = JSON.parse(JSON.stringify(global.moduleConfig.tokenAbi));
    }
    else if (tokenCrossType === global.moduleConfig.tokenCrossType.ERC721) {
      tokenAbi = JSON.parse(JSON.stringify(global.moduleConfig.erc721abi));
      token.tokenType = "TOKEN721";
    }
    else if (tokenCrossType === global.moduleConfig.tokenCrossType.ERC1155) {
      tokenAbi = JSON.parse(JSON.stringify(global.moduleConfig.erc1155abi));
      token.tokenType = "TOKEN1155";
    }
    else {
      log.error("getTokenInfo err tokenCrossType", tokenCrossType);
      return null;
    }

    let symbol = 'symbol';
    let decimals = 'decimals';

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        // token.tokenSymbol = await self.getSolVar(tokenAbi, tokenScAddr, symbol);
        if (tokenCrossType === global.moduleConfig.tokenCrossType.ERC20) {
          token.decimals = (await self.getSolVar(tokenAbi, tokenScAddr, decimals)).toString(10);

          if (0 < parseInt(token.decimals) <= 18) {
            resolve(token);
          } else {
            log.error("getTokenInfo decimals invalid");
            reject("getTokenInfo decimals invalid");
          }
        }
        else {
          token.decimals = 0;
          resolve(token);
        }
      } catch (err) {
        log.error("getTokenInfo", err);
        reject((err.hasOwnProperty("message") ? err.message : err));
      }
    }, global.moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenInfo timeout');
  }

  async isValidAddress(address) {
    try {
      let validate;
      if (/^0x[0-9a-f]{40}$/.test(address.toLowerCase())) {
        validate = true;
      } else {
        validate = false;
      }
      return validate;
    } catch (err) {
      this.log.error("isValidAddress Error:", err);
      return false;
    }
  }

  parseAddress(userAccount) {
    return hexAdd0x(userAccount);
  }

  getAccountFromPrivateKey(privateKey) {
    const web3 = new Web3();
    return web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  getPublicKeyFromPrivateKey(privateKey) {
    const ec = new elliptic.ec('secp256k1');

    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2);
    }

    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    const publicKey = keyPair.getPublic('hex');

    return '0x' + publicKey;
  }

  async getFromAddressByHash(txHash) {
    let transaction = await this.getTransactionReceiptSync(txHash);
    return transaction.from ? transaction.from.toLowerCase() : transaction.from;
  }

  publicKeyToAddress(publicKey) {
    const prefixedKey = publicKey.startsWith('0x') ? publicKey : '0x' + publicKey;

    const publicKeyBuffer = Buffer.from(prefixedKey.slice(2), 'hex');

    const addressBuffer = ethUtil.publicToAddress(publicKeyBuffer, true);

    const address = ethUtil.bufferToHex(addressBuffer);

    return address;
  }
}

module.exports = EthBaseChain;
