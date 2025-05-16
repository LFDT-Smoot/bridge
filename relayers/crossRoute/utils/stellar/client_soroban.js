/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const {
  SorobanRpc,
  scValToNative
} = require('@stellar/stellar-sdk');


let g_client = null;

const initRpcClient = async (url) => {
  if(!g_client) {
    g_client = new SorobanRpc.Server(url);
  }
  return g_client
}

const getRpcClient = async () => {
  return g_client
}

const txSend = async (signedTransaction, logger = console)=> {
  if(!g_client){
    throw new Error("txSend() You haven't initialized SorobanRpc client");
  }
  try {
    let sendResponse = await g_client.sendTransaction(signedTransaction);
    console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

    if (sendResponse.status === "PENDING") {
      let getResponse = await g_client.getTransaction(sendResponse.hash);
      // Poll `getTransaction` until the status is not "NOT_FOUND"
      while (getResponse.status === "NOT_FOUND") {
        console.log("Waiting for transaction confirmation...");
        // See if the transaction is complete
        getResponse = await g_client.getTransaction(sendResponse.hash);
        // Wait one second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`getTransaction response: ${JSON.stringify(getResponse)}`);

      if (getResponse.status === "SUCCESS") {
        // Make sure the transaction's resultMetaXDR is not empty
        if (!getResponse.resultMetaXdr) {
          throw "Empty resultMetaXDR in getTransaction response";
        }
        // Find the return value from the contract and return it
        let transactionMeta = getResponse.resultMetaXdr;
        let returnValue = transactionMeta.v3().sorobanMeta().returnValue();
        //console.log(`Transaction result: ${returnValue.value()}`);
        console.log('Transaction result is: ', scValToNative(returnValue));
	return sendResponse.hash;
      } else {
        throw `Transaction failed: ${getResponse.resultXdr}`;
      }
    } else {
      throw new Error(`SorobanRPC return unexpected result: ${JSON.stringify(sendResponse)}`);
    }
  } catch (err) {
    // Catch and report any errors we've thrown
    logger.error("Sending transaction failed");
    logger.error(err);
    throw err;
  }
}

const sendOperation = async (sourceKeypair, builtTransaction)=>{
  if(!g_client){
    throw new Error("sendOperation() You haven't initialized SorobanRpc client");
  }
  console.log(`builtTransaction=${builtTransaction.toXDR()}`);
  let preparedTransaction = await g_client.prepareTransaction(builtTransaction);
  console.log('preparedTransaction is: ', preparedTransaction);
  preparedTransaction.sign(sourceKeypair);
  console.log(`Signed prepared transaction XDR: ${preparedTransaction.toEnvelope().toXDR("base64")}`,);
  await txSend(preparedTransaction);
}



module.exports = {
  initRpcClient,
  getRpcClient,
  txSend,
}

