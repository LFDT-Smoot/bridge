/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
require('module-alias/register')

const HorizonClient = require('./client_horizon');
const { eventParser } = require("./tx_event_parser");

const client = new HorizonClient();

async function main() {
 
    // let blockNumber = await client.getLastLedgerSequence();
    
    // blockNumber = 385601; // has 3 Tx there
    // let txs = await client.getTxsInLedger(blockNumber);
    // console.log("txs size: ",txs.length);

    // await client.getAsset("codexxx", "issuerXXX");

    // await client.getAllBalance("GBVHY3F3BJ22VF2DBYRWPK3JBWFAKVWJC6MVHPN7F7W4YOZ4JUSS5OMR");
    // await client.getAllAssets();

    const txInfo = await client.getTransactionDetails("89d8aba22d40583f5f240bdcb28ba0b3dc9fe0f4befcb007bb5875ddcb1acf91");  // just look for Tx of NFT-Market contract
    const events = eventParser(txInfo.resultMetaXdr)
    console.log("events: ", events);
}

main().catch(function(e) {
    console.error(e);
}).finally(function() {
    console.log('done');
});