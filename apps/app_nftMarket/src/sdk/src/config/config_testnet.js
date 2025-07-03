const config = {
  StoremanService: [
    {
      chainId: "2147484614",
      chainName: "Polygon",
      symbol: "MATIC",
      chainDecimals: 18,
      marketScAddr: "0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2",
      wmbScAddr: "0x01515a9cFcB38030c1C5B82827C03b881D825F54",
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
      marketScAddr: "CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
      marketNftAddr: "CB6SZVUAFKBOSWNRD3SQ4S42DT7UN5OJ3WIAXPELZ7TNNQL444EOVKIJ",
      wmbScAddr: "CB2H4YDRDJR5BQEYGT76VVJH2FXA54AB6ZWCVX5OVVTVUAVCII7HVGHB",  //gateway
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