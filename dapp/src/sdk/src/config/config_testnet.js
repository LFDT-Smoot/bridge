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
      marketScAddr: "0x77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1",
      wmbScAddr: "0xaA486ca50A0cb9c8d154ff7FfDcE071612550042",
      wmbGas: 2000000,
      multicallScAddr: "0x201E5dE97DFc46aAce142B2009332c524c9D8D82",
      network: 80002,
      rpc: "https://rpc-amoy.polygon.technology",
      ScScanInfo: {
        taskInterval: 10000
      }
    }
  ],
  apiServer: {
    url: "https://stellardemo.wanscan.org:6001"
  },
  noEthChainInfo: [
    {
      chainId: "2147483796",
      chainName: "Stellar",
      symbol: "XLM",
      chainDecimals: 6,
      marketScAddr: "CD4M7URGNOKO5V5CDBLSBJKUJUW5XBXEG2E5OQU3C325FSIMJZMM7UFQ",
      wmbScAddr: "CB6IPBQO27IMYHQNDONI7XKHVM6CJ7LIVW4RY65ULFGD5AIT6CTSTRRV",
      wmbGas: 300000,
      network: "TESTNET",
      rpc: "https://soroban-testnet.stellar.org:443",
      ScScanInfo: {
        taskInterval: 15000
      }
    }
  ]
};

export default config;