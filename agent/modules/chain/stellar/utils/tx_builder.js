/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const {Contract, SorobanRpc, TransactionBuilder, BASE_FEE, Networks, nativeToScVal} = require("@stellar/stellar-sdk");

/**
 *
 * @param message_sc
 * @param callerPubKey
 * @param args: {chainID, encodedInfo, encodedProof}
 * @returns {Promise<void>}
 */
async function inBoundCallTxBuilder(message_sc, callerPubKey, args) {
  const soroban_testUrl = "https://soroban-testnet.stellar.org:443"

  const {chainID, encodedInfo, encodedProof} = {...args};

  let contract = new Contract(message_sc);
  const server = new SorobanRpc.Server(soroban_testUrl);

  const sourceAccount = await server.getAccount(callerPubKey);
  let builtTransaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  }).addOperation(
    contract.call("inbound_call",
      nativeToScVal(chainID, {type:"u256"}),
      nativeToScVal(encodedInfo),
      nativeToScVal(encodedProof)
    )
  ).setTimeout(30).build();
  console.log(`builtTransaction=${builtTransaction.toXDR()}`);
  let preparedTransaction = await server.prepareTransaction(builtTransaction);
  return preparedTransaction;
}

module.exports = {
  inBoundCallTxBuilder,
}