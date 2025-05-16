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
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/',
      accounts: [process.env.PK],
    },
    polygonAmoy: {
      url: 'https://polygon-amoy-bor-rpc.publicnode.com',
      accounts: [process.env.PK],
    }
  },
  etherscan: {
    apiKey: ''
  }
};
