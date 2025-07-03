const HorizonClient = require('./client_horizon');
const decoder = require("./decoder");

const client = new HorizonClient();

async function main() {
 
    // let blockNumber = await client.getLastLedgerSequence();
    
    // blockNumber = 385601; // has 3 Tx in this block
    // let txs = await client.getTxsInLedger(blockNumber);
    // console.log("txs size: ",txs.length);

    // await client.getAsset("codexxx", "issuerXXX");

    // await client.getAllBalance("GBVHY3F3BJ22VF2DBYRWPK3JBWFAKVWJC6MVHPN7F7W4YOZ4JUSS5OMR");
    // await client.getAllAssets();

    const txInfo = await client.getTransactionDetails("16627b30bfee7d3895cf24cfceab72482f4f4bbb7a2a1d614998f8e08f7035ac");  // just look for Tx of NFT-Market contract

    const events = decoder.decodeFromXDR(txInfo.resultMetaXdr, "TransactionMeta")
    console.log(events);
}

main().catch(function(e) {
    console.error(e);
}).finally(function() {
    console.log('done');
});