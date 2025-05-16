/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class EvmUnwrapNft {
  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, tokenId, toAccount}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessEvmUnwrapNft";
    console.debug("EvmUnwrapNft params: %O", params);
    let steps = [
      {name: "Unwrap NFT", params}
    ];
    return steps;
  }
};
