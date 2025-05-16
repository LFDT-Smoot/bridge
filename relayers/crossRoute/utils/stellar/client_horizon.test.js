/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const HorizonClient = require('./client_horizon');
const decoder = require("./decoder");

const client = new HorizonClient();

async function main() {
 
    // let blockNumber = await client.getLastLedgerSequence();
    
    // blockNumber = 385601; // 有3个Tx
    // let txs = await client.getTxsInLedger(blockNumber);
    // console.log("txs size: ",txs.length);

    // await client.getAsset("codexxx", "issuerXXX");

    // await client.getAllBalance("GBVHY3F3BJ22VF2DBYRWPK3JBWFAKVWJC6MVHPN7F7W4YOZ4JUSS5OMR");
    // await client.getAllAssets();

    const txInfo = await client.getTransactionByTxHash("77682b7bb55769a82b1f959b560e137696948a6eab8ec2b8b2b574705cb8fee0");  // just look for Tx of NFT-Market contract
    
    // xdr.TransactionMeta.fromXDR(resultMetaXdr, "base64"); // 不用这一步~ 在 decoder.decodeFromXDR() 内部会执行这个操作的

    const events = decoder.decodeFromXDR(txInfo.result_meta_xdr, "TransactionMeta")
    console.log(events);
}

main().catch(function(e) {
    console.error(e);
}).finally(function() {
    console.log('done');
});