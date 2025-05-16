/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const Web3 = require("web3");
const elliptic = require('elliptic');
const ethUtil = require('ethereumjs-util');
const { toBN, } = require('web3-utils');

const keyStore = require("../utils/keyStore");

const {
  hexAdd0x,
} = require('../comm/lib');


function getAccountFromPrivateKey(privateKey) {
  const web3 = new Web3();
  return web3.eth.accounts.privateKeyToAccount(privateKey);
}

function getPublicKeyFromPrivateKey(privateKey) {
  const ec = new elliptic.ec('secp256k1');

  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.slice(2);
  }

  const keyPair = ec.keyFromPrivate(privateKey, 'hex');
  const publicKey = keyPair.getPublic('hex');

  return '0x' + publicKey;
}

function publicKeyToAddress(publicKey) {
  const prefixedKey = publicKey.startsWith('0x') ? publicKey : '0x' + publicKey;

  const publicKeyBuffer = Buffer.from(prefixedKey.slice(2), 'hex');

  const addressBuffer = ethUtil.publicToAddress(publicKeyBuffer, true);

  const address = ethUtil.bufferToHex(addressBuffer);

  return address;
}

/**
 * Get private key from key store. Return value is a Buffer object
 * @param password
 * @param address
 * @param keyStoreDir
 */
function _getPrivateKeyFromKS(password, address, keyStoreDir = null) {
  let privateKey;
  let fromAddr = address;
  if (global.privateKey && global.privateKey[fromAddr]) {
    privateKey = global.privateKey[fromAddr];
  } else {
    if (keyStoreDir === null) {
      privateKey = keyStore.getPrivateKey(fromAddr, password);
    } else {
      privateKey = keyStoreDir.getAccount(fromAddr).getPrivateKey(password);
    }
    if (!global.privateKey) {
      global.privateKey = {};
    }
    global.privateKey[fromAddr] = privateKey;
  }
  return privateKey;
}

function getPrivateKey(password, address, keyStoreDir = null) {
  return  _getPrivateKeyFromKS(password, address, null)

}

function getPrivateKeyStr(password, address, keyStoreDir = null) {
  let privateKey;
  privateKey = _getPrivateKeyFromKS(password, address, keyStoreDir)
  return privateKey.toString('hex');
}


function getChainPassword(chainType) {
  if (!global.secret) {
    global.secret = {};
  }
  return global.secret['WORKING_PWD'];
}

function convertSignatures(signatures) {
  return signatures.map((sig) => {
    const address = publicKeyToAddress(sig.pk);

    const by = toBN(address);
    const signature = ethUtil.fromRpcSig(hexAdd0x(sig.signature));

    let convertSig = {
      by: by.toString(10), // uint256 by
      sigR: hexAdd0x(signature.r.toString('hex')), // uint256 sigR
      sigS: hexAdd0x(signature.s.toString('hex')), // uint256 sigS
      sigV: signature.v, // uint256 sigV
      meta: '0x' + '0'.repeat(64) // bytes32 meta, set 0x0000...
    };
    return [convertSig.by, convertSig.sigR, convertSig.sigS, convertSig.sigV, convertSig.meta]
  });
}


module.exports = {
  getChainPassword,
  getPrivateKeyStr,
  getPrivateKey,
  publicKeyToAddress,
  getPublicKeyFromPrivateKey,
  getAccountFromPrivateKey,
  convertSignatures
}
// end 
