/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class ProcessStellarSellOrder {
  constructor(frameworkService) {
    this.frameworkService = frameworkService;
    this.chainInfoService = this.frameworkService.getService("ChainInfoService");
  }

  async process(stepData, wallet) {
    let params = stepData.params;
    try {
      let stallar = this.chainInfoService.getChainInfoByName("Stellar");
      let polygon = this.chainInfoService.getChainInfoByName("Polygon");
      let marketService = this.frameworkService.getService("StellarService");
      let wmbFee = await marketService.getWmbFee(polygon.chainId, polygon.wmbGas);
      let tx = await marketService.buildSellOrderTx(params.fromAccount, params.tokenId, params.price, params.toAccount, {wmbFee});
      let signedTx = await wallet.signTransaction(tx.toXDR(), {network: stallar.network, accountToSign: params.fromAccount});
      let receipt = await marketService.sendTx(signedTx);
      if (receipt.status !== "SUCCESS") {
        throw new Error("Transaction failed");
      }
      return receipt;
    } catch (err) {
      if (err.toString() === "User declined access") {
        throw new Error("User rejected");
      } else {
        // console.error("ProcessStellarSellOrder error: %O", err);
        throw err;
      }
    }
  }
};
