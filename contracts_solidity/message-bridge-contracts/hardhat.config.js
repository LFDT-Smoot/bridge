/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "london",
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    hardhat: {},
    polygonAmoy: {
      url: 'https://polygon-amoy-bor-rpc.publicnode.com',
      accounts: [process.env.PK],
    }
  },
  etherscan: {
    apiKey: ''
  }
};
