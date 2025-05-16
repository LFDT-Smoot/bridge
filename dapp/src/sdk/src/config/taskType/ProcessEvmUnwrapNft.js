/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import BigNumber from "bignumber.js";

export default class ProcessEvmUnwrapNft {
  constructor(frameworkService) {
    this.frameworkService = frameworkService;
    this.chainInfoService = this.frameworkService.getService("ChainInfoService");
  }

  async process(stepData, wallet) {
    let params = stepData.params;
    try {
      let polygon = this.chainInfoService.getChainInfoByName("Polygon");
      let marketService = this.frameworkService.getService(params.fromChainName + "Service");
      // safeTransferFrom is nonpayable, do not send value
      let scData = await marketService.getUnwrapNftTxData(params.fromAccount, polygon.marketScAddr, params.tokenId, params.toAccount, {from: params.fromAccount});
      let rawTx = {
        from: params.fromAccount,
        to: polygon.marketScAddr,
        data: scData.data,
        value: 0,
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
        // console.error("ProcessEvmUnwrapNft error: %O", err);
        throw err;
      }
    }
  }
};
