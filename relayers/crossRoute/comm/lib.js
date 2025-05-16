/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const fs = require('fs');
const BigNumber = require('bignumber.js');

function loadJsonFile(path) {
  let json = JSON.parse(fs.readFileSync(path));
  return json;
}

function loadConfig() {
  const path = require('path');
  let configDir, configRelatePath;
  if (global.pkg) {
    configDir = process.cwd();
    configRelatePath = '../conf/config.json';
  } else {
    configDir = __dirname;
    configRelatePath = '../conf/config.json';
  }
  const configPath = path.join(configDir, configRelatePath);

  let configJson = loadJsonFile(configPath);
  let config = global.testnet ? configJson.testnet : configJson.main;

  global.config = config;
  return global.config;
}

function hexTrip0x(hexs) {
  if (0 == hexs.indexOf('0x')) {
      return hexs.slice(2);
  }
  return hexs;
}

function hexAdd0x(hexs) {
  if (0 != hexs.indexOf('0x')) {
      return '0x' + hexs;
  }
  return hexs;
}

function toBigNumber (n) {
  n = n || 0;

  if (typeof n === 'string' && (n.indexOf('0x') === 0 || n.indexOf('-0x') === 0)) {
      return new BigNumber(n.replace('0x', ''), 16);
  }

  return new BigNumber(n.toString(10), 10);
}

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

function getChainSymbolByChainId(chainId) {
  let chainConstants = require('bip44-constants')
  let chainInfo = chainConstants.filter(item => item[0] === Number(chainId));
  if (chainInfo.length === 0) {
    return undefined;
  }
  return chainInfo[0][1];
}

/**
 *
 * @param hex:
 * @returns {string}
 *
 * example: hexToAscii("724471615638616f57505371504764793669584c597a716541314445474d43727a4a3a4d6f6f")
 * got:  'rDqaV8aoWPSqPGdy6iXLYzqeA1DEGMCrzJ:Moo'
 */
function hexToAscii(hex) {
  var hex = hex.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

exports.loadJsonFile = loadJsonFile;
exports.loadConfig = loadConfig;
exports.hexTrip0x = hexTrip0x;
exports.hexAdd0x = hexAdd0x;
exports.toBigNumber = toBigNumber;
exports.sleep = sleep;
exports.getChainSymbolByChainId = getChainSymbolByChainId;
exports.hexToAscii = hexToAscii;

