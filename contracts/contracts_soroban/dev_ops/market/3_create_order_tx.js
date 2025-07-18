const config = require('../config');
const StellarClient = require('../StellarClient');
const {
    xdr,StrKey, nativeToScVal, Address, ScInt, scValToBigInt, scValToNative
} = require('@stellar/stellar-sdk');
const txHash = "44f3ffb4364ed6114537d21fb5cd02dcb1fbb1c3ea4940c8c1f5e2a19be83ed4";

const run = async () => {
    let client = new StellarClient();

    let ret = await client.getTransactionByTxHash(txHash);
    //console.log('ret: ', ret);
    let result_meta_xdr = ret.result_meta_xdr;
    let data = xdr.TransactionMeta.fromXDR(result_meta_xdr, 'base64');
    console.log('data: ', data);

    let dataObj = JSON.parse(JSON.stringify(data));
    console.log('dataObj: ', dataObj._value._attributes.sorobanMeta._attributes.events);

    let events = dataObj._value._attributes.sorobanMeta._attributes.events;
    for(let i = 0 ; i < events.length; i++) {
        console.log('contractId: ', events[i]._attributes.contractId, ' type: ', events[i]._attributes.type);
        console.log('body: ', events[i]._attributes.body._value._attributes)
        let attributes = events[i]._attributes.body._value._attributes;
        let topics =attributes.topics;
        for(let j = 0; j < topics.length; j++) {
            console.log('topic: ', j , 'value: ', topics[j]._value.data)
            let topic_data = topics[j]._value.data;
            let topic = Buffer.from(topic_data);
            console.log('topic: ', topic);
        }
        console.log('data: ', attributes.data._value.data);
/*
*  [0,0,0,17,0,0,0,1,0,0,0,7,0,0,0,15,0,0,0,5,98,117,121,101,114,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,207,162,38,68,10,91,52,15,0,21,37,157,153,0,131,166,134,63,37,184,227,238,75,155,40,2,176,105,174,170,100,13,0,0,0,15,0,0,0,12,109,101,115,115,97,103,101,95,116,121,112,101,0,0,0,14,0,0,0,11,67,114,101,97,116,101,79,114,100,101,114,0,0,0,0,15,0,0,0,12,110,102,116,95,99,111,110,116,114,97,99,116,0,0,0,18,0,0,0,1,85,86,179,27,206,32,105,26,9,110,106,66,182,81,122,71,76,131,245,95,94,181,214,133,169,46,117,146,58,8,228,152,0,0,0,15,0,0,0,6,110,102,116,95,105,100,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,33,0,0,0,15,0,0,0,5,112,114,105,99,101,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,1,226,64,0,0,0,15,0,0,0,11,112,114,105,99,101,95,116,111,107,101,110,0,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,15,0,0,0,8,114,101,99,105,112,101,110,116,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,56,129,0,0,0,18,0,0,0,1,97,14,62,47,46,30,126,26,192,71,174,7,131,221,59,140,18,215,80,53,0,173,77,221,27,95,34,53,214,18,152,102]
* [0,0,0,17,0,0,0,1,0,0,0,7,0,0,0,15,0,0,0,5,98,117,121,101,114,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,207,162,38,68,10,91,52,15,0,21,37,157,153,0,131,166,134,63,37,184,227,238,75,155,40,2,176,105,174,170,100,13,0,0,0,15,0,0,0,12,109,101,115,115,97,103,101,95,116,121,112,101,0,0,0,14,0,0,0,11,67,114,101,97,116,101,79,114,100,101,114,0,0,0,0,15,0,0,0,12,110,102,116,95,99,111,110,116,114,97,99,116,0,0,0,18,0,0,0,1,85,86,179,27,206,32,105,26,9,110,106,66,182,81,122,71,76,131,245,95,94,181,214,133,169,46,117,146,58,8,228,152,0,0,0,15,0,0,0,6,110,102,116,95,105,100,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,34,0,0,0,15,0,0,0,5,112,114,105,99,101,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,1,226,64,0,0,0,15,0,0,0,11,112,114,105,99,101,95,116,111,107,101,110,0,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,15,0,0,0,8,114,101,99,105,112,101,110,116,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,56,129,0,0,0,18,0,0,0,1,86,158,171,31,116,122,221,54,25,224,89,221,52,56,158,153,128,206,222,231,118,106,162,68,222,77,63,71,38,240,76,48]
* */
    }



}

//run();

