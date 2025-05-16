/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class EvmBuyNft {
  constructor(frameworkService) {
    this.frameworkService = frameworkService;
  }

  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, orderKey}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessEvmBuyNft";
    // order info
    let marketService = this.frameworkService.getService(actionInfo.fromChainName + "Service");
    let orderInfo = await marketService.getOrderInfo(actionInfo.orderKey);
    params.price = orderInfo.price;
    params.tokenId = orderInfo.nftId;
    console.debug("EvmBuyNft params: %O", params);
    let steps = [
      {name: "Buy NFT", params}
    ];
    return steps;
  }
};
