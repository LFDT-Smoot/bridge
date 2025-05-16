/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class StellarTransferNft {
  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, tokenId, toAccount}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessStellarTransferNft";
    console.debug("StellarTransferNft params: %O", params);
    let steps = [
      {name: "Transfer NFT", params}
    ];
    return steps;
  }
};
