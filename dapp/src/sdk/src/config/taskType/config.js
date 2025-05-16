/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const config = [
  {
    name: "ProcessStellarSellOrder",
    handle: require("./ProcessStellarSellOrder.js").default
  },
  {
    name: "ProcessStellarCancelOrder",
    handle: require("./ProcessStellarCancelOrder").default
  },
  {
    name: "ProcessStellarTransferNft",
    handle: require("./ProcessStellarTransferNft").default
  },
  {
    name: "ProcessEvmBuyNft",
    handle: require("./ProcessEvmBuyNft").default
  },
  {
    name: "ProcessEvmUnwrapNft",
    handle: require("./ProcessEvmUnwrapNft").default
  }
];

export default config;