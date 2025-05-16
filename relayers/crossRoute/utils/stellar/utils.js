/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


const {
  Keypair,
} = require("@stellar/stellar-sdk");

const {hexTrip0x} = require("../../comm/lib");

function getAccountFromPrivateKey(privateKey) {
  const address = getPublicKeyFromPrivateKey(privateKey);
  return { address: address }
}

function getPublicKeyFromPrivateKey(privateKey) {
  let keyPair = Keypair.fromSecret(privateKey);
  let pubKey = keyPair.publicKey();
  return pubKey;
}

function getKeyPairFromPrivateKey(privateKey) {
  return Keypair.fromSecret(privateKey);
}

function getKeyPairFromEd25519Seed(seed) {
  const privKeyBuffer = new Buffer.from(hexTrip0x(seed), "hex");
  const keyPair = Keypair.fromRawEd25519Seed(privKeyBuffer);
  return keyPair;
}

module.exports = {
  getAccountFromPrivateKey,
  getPublicKeyFromPrivateKey,
  getKeyPairFromPrivateKey,
  getKeyPairFromEd25519Seed
}
