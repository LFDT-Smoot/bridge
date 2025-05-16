/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import Web3 from "web3";

export default class Web3Wallet {
  constructor(provider, type = "MetaMask") {
    this.name = "Web3";
    this.web3 = new Web3(provider);
    this.type = type; // the type is not mandatory, many web3-compatible wallets are slightly different, can be handled differently according to the type
  }

  async getNetwork() {
    return this.web3.eth.getChainId();
  }

  async getAccounts(network) {
    let accounts = [];
    try { // WalletConnect do not support requestAccounts
      accounts = await this.web3.eth.requestAccounts();
    } catch(err) {
      accounts = await this.web3.eth.getAccounts();
    }
    return accounts;
  }

  async sendTransaction(txData) {
    if (!txData.gasPrice) {
      txData.gasPrice = await this.web3.eth.getGasPrice();
      console.debug("%s getGasPrice: %s", this.name, txData.gasPrice);
    }
    return new Promise((resolve, reject) => {
      this.web3.eth.sendTransaction(txData)
      .on("transactionHash", txHash => {
        console.debug("web3Wallet sendTransaction txHash: %s", txHash);
      }).on("error", err => {
        console.debug("web3Wallet sendTransaction error: %O", err);
        reject(err);
      }).on("receipt", receipt => {
        console.debug("web3Wallet sendTransaction receipt: %s", receipt);
        resolve(receipt);
      })
    });
  }
}