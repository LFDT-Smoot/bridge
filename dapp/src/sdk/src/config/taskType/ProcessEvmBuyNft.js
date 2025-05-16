/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import BigNumber from "bignumber.js";

export default class ProcessEvmBuyNft {
  constructor(frameworkService) {
    this.frameworkService = frameworkService;
    this.chainInfoService = this.frameworkService.getService("ChainInfoService");
  }

  async process(stepData, wallet) {
    let params = stepData.params;
    try {
      let polygon = this.chainInfoService.getChainInfoByName("Polygon");
      let stallar = this.chainInfoService.getChainInfoByName("Stellar");
      let marketService = this.frameworkService.getService(params.fromChainName + "Service");
      let wmbFee = await marketService.getWmbFee(stallar.chainId, stallar.wmbGas);
      let value = "0x" + new BigNumber(params.price).plus(wmbFee).toString(16);
      let scData = await marketService.getBuyNftTxData(params.orderKey, {from: params.fromAccount, value});
      let rawTx = {
        from: params.fromAccount,
        to: polygon.marketScAddr,
        data: scData.data,
        value,
        gas: scData.gasLimit
      };
      let receipt = await wallet.sendTransaction(rawTx);
      if (Number(receipt.status) === 0) {
        throw new Error("Transaction failed");
      }
      return receipt;
    } catch (err) {
      if (err.code === 4001) {
        throw new Error("User rejected");
      } else {
        // console.error("ProcessEvmBuyNft error: %O", err);
        throw err;
      }
    }
  }
};
