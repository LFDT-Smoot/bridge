/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const config = {
  StoremanService: [
    {
      chainId: "2147484614",
      chainName: "Polygon",
      symbol: "MATIC",
      chainDecimals: 18,
      marketScAddr: "",
      wmbScAddr: "",
      wmbGas: 2000000,
      multicallScAddr: "",
      network: 137,
      rpc: "https://polygon-rpc.com",
      ScScanInfo: {
        taskInterval: 10000
      }
    }
  ],
  apiServer: {
    url: "https://localhost"
  },
  noEthChainInfo: [
    {
      chainId: "2147483796",
      chainName: "Stellar",
      symbol: "XLM",
      chainDecimals: 6,
      marketScAddr: "",
      wmbScAddr: "",
      wmbGas: 300000,
      network: "PUBLIC",
      rpc: "",
      ScScanInfo: {
        taskInterval: 15000
      }
    }
  ]
};

export default config;