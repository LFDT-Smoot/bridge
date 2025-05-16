/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import BigNumber from "bignumber.js";

export default class StellarSellOrder {
  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, tokenId, price, toAccount}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessStellarSellOrder";
    params.price = new BigNumber(params.price).times(Math.pow(10, 18)).toFixed(0); // only MATIC now
    console.debug("StellarSellOrder params: %O", params);
    let steps = [
      {name: "Create Sell Order", params}
    ];
    return steps;
  }
};
