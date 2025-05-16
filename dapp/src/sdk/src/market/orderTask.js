/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as tool from "../utils/tool.js";

export default class OrderTask {
  /* options
    StellarSellOrder: {toAccount, tokenId, price}
    StellarCancelOrder: {orderKey}
    EvmBuyNft: {orderKey}
    EvmUnwrapNft: {tokenId, toAccount}
  */
  constructor(market, action, fromChainName, fromAccount, wallet, options) {
    this.id = Date.now();
    this.market = market;
    this.wallet = wallet;
    this.data = Object.assign({action, fromChainName, fromAccount}, options);
    this.steps = [];
  }

  async start() {
    console.debug("OrderTask %d start at %d ms", this.id, tool.getCurTimestamp());
    // build
    let actionInfo = Object.assign({}, this.data);
    this.steps = await this.market.actionHandleService.getProcessTasks(actionInfo);
    // console.debug("getProcessTasks: %O", steps);
    // process
    await this.procTaskSteps();
  }

  async procTaskSteps() {
    console.debug("OrderTask procTaskSteps total %d at %s ms", this.steps.length, tool.getCurTimestamp());
    for (let curStep = 0; curStep < this.steps.length; curStep++) {
      let taskStep = this.steps[curStep];
      console.debug("OrderTask procTaskSteps step %s at %s ms", curStep, tool.getCurTimestamp());
      let result = await this.market.taskHandleService.processTask(taskStep, this.wallet);
      taskStep.result = result;
      console.debug("OrderTask %s result: %O", taskStep.name, result);
    }
  }
}