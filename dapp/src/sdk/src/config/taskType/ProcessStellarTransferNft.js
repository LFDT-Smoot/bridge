/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class ProcessStellarTransferNft {
  constructor(frameworkService) {
    this.frameworkService = frameworkService;
    this.chainInfoService = this.frameworkService.getService("ChainInfoService");
  }

  async process(stepData, wallet) {
    let params = stepData.params;
    try {
      let stallar = this.chainInfoService.getChainInfoByName("Stellar");
      let marketService = this.frameworkService.getService("StellarService");
      let tx = await marketService.buildTransferNftTx(params.fromAccount, params.tokenId, params.toAccount);
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
        // console.error("ProcessStellarTransferNft error: %O", err);
        throw err;
      }
    }
  }
};
