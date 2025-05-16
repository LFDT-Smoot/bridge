/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

const config = {
  mainnet: require("../../config/config_mainnet.js").default,
  testnet: require("../../config/config_testnet.js").default
}

const abis = {
  nftMarket: require("../../config/abi/nftMarket.json"),
  wmb: require("../../config/abi/wmb.json"),
}

export default class ConfigService {
  constructor() {
    this.extensions = new Map();
  }

  async init(network) {
    this.network = network;
    this.curConfig = config[network];
  }

  getNetwork() {
    return this.network;
  }

  getAbi(contractName) {
    return abis[contractName];
  }

  getConfig(serviceName, propertyPath) {
    let fullPropertyPath = serviceName;
    if (propertyPath && propertyPath !== '.') fullPropertyPath = fullPropertyPath + '.' + propertyPath;
    let ret = _.get(this.curConfig, fullPropertyPath);
    return ret;
  }

  getGlobalConfig(name) {
    return _.get(this.curConfig, name);
  }
}
