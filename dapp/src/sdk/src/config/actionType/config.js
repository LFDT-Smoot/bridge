/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const config = [
  {
    name: "StellarSellOrder",
    handle: require("./StellarSellOrder.js").default
  },
  {
    name: "StellarCancelOrder",
    handle: require("./StellarCancelOrder").default
  },
  {
    name: "StellarTransferNft",
    handle: require("./StellarTransferNft").default
  },
  {
    name: "EvmBuyNft",
    handle: require("./EvmBuyNft").default
  },
  {
    name: "EvmUnwrapNft",
    handle: require("./EvmUnwrapNft").default
  }
]

export default config;