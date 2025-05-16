/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const fs = require('fs');
const keythereum = require("keythereum");

const keyStorePath = global.keystore;

const keyStore = {
  getFromFile(fileName) {
    let keystoreStr = fs.readFileSync(fileName, "utf8");
    return JSON.parse(keystoreStr);
  },

  getKeystoreJSON(address) {
    let fileName = this.getKeystoreFile(address);
    if (fileName) {
      let keystoreStr = fs.readFileSync(fileName, "utf8");
      return JSON.parse(keystoreStr);
    } else {
      console.log("Can not find keystore file for address: " + address, ", keyStorePath: ", keyStorePath);
    }
    return null;
  },

  getKeystoreFile(address) {
    if (address.substr(0, 2) === '0x' || address.substr(0, 2) === '0X')
      address = address.substr(2);
    let files = fs.readdirSync(keyStorePath);
    for (var i in files) {
      var item = files[i];
      if (item.toLowerCase().indexOf(address.toLowerCase()) >= 0) {
        return keyStorePath + item;
      }
    }
  },

  getKeystorePath() {
    return keyStorePath;
  },

  getPrivateKey(address, password) {
    let keystore = this.getKeystoreJSON(address);
    let keyAObj = { version: keystore.version, crypto: keystore.crypto };
    let privKeyA;
    try {
      privKeyA = keythereum.recover(password, keyAObj);
    } catch (error) {
      console.log('User Transaction input : ', 'wrong password');
      return null;
    }
    return privKeyA;
  }
};
module.exports = keyStore;