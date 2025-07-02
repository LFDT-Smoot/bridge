const {nativeToScVal, Address, scValToNative,xdr
} = require("@stellar/stellar-sdk");
const config = require("../config");
let data = [0,0,0,13,0,0,0,32,253,225,92,206,154,199,220,220,79,27,158,33,66,211,46,0,9,249,24,241,91,108,172,86,183,165,183,235,92,117,16,189,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,95,145,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,14,0,0,0,11,67,114,101,97,116,101,79,114,100,101,114,0,0,0,0,18,0,0,0,1,214,92,210,137,123,47,57,229,187,23,124,130,29,38,242,67,137,132,197,97,193,50,224,204,43,104,221,60,130,231,159,210,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,38,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,1,226,64,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,18,0,0,0,0,0,0,0,0,207,162,38,68,10,91,52,15,0,21,37,157,153,0,131,166,134,63,37,184,227,238,75,155,40,2,176,105,174,170,100,13]
let data_buf = Buffer.from(data);

const getEncodeInfo =  ()=> {
    // taskId bytes32,   32
    // networkId uint256, 32
    // contractAddr address, evm-Address,  20
    // functionCallData , Bytes,

    /*
    * functionCallData
    * message_type
    * nft_contract  //40
    * nft_id,      20
    * price_token,   28
    * price,       20

    * receipt, 28
    * buyer  44
    * */

    let message_type = nativeToScVal("CreateOrder", {type: "string"});
    let nft_contract =     nativeToScVal(new Address(config.scAddr.nft), {type:"Address"});
    let nft_contract_bytes = nft_contract.toXDR();
    console.log('nft_contract_bytes: ', nft_contract_bytes.length)
    let nft_id =     nativeToScVal(20006, {type:"i128"});
    let price_token =     nativeToScVal(new Buffer.from("BB4E992daA6a51872C15Bf9db8f072624b91D37B", 'hex'));
    let price =    nativeToScVal(123456, {type:'i128'});
    let recipent =    nativeToScVal(new Buffer.from("BB4E992daA6a51872C15Bf9db8f072624b91D37B", 'hex'));
    let buyer =     nativeToScVal(new Address(config.user3.PublicKey), {type:"Address"});

    let byts = Buffer.concat([message_type.toXDR(),nft_contract.toXDR(),nft_id.toXDR(), price_token.toXDR(),price.toXDR() , recipent.toXDR(), buyer.toXDR()]);
    // taskId bytes32,   40
    // networkId uint256, 36
    // contractAddr address, evm-Address,  28
    // functionCallData , Bytes,
        /* message_type
         * nft_contract  //40
         * nft_id,      20
         * price_token,   28
         * price,       20

         * receipt, 28
         * buyer  44
*/

    let taskId = nativeToScVal(new Buffer('fde15cce9ac7dcdc4f1b9e2142d32e0009f918f15b6cac56b7a5b7eb5c7510bd', 'hex'));
    let taskIdBytes = taskId.toXDR();
    console.log('taskIdBytes.length: ', taskIdBytes.length);  //40
    let networId = nativeToScVal(90001, {type:'u256'}); //36

    let contractAddr = nativeToScVal(new Address(config.scAddr.nft_market), {type:"Address"}); //40

    let encodeInfo = Buffer.concat([taskId.toXDR(), networId.toXDR(), contractAddr.toXDR(), byts]);
    return encodeInfo;
}

const parseEncodeInfo = ()=> {
    // taskId bytes32,   40
    // networkId uint256, 36
    // contractAddr address, evm-Address,  28
    // functionCallData , Bytes,
    /* message_type
     * nft_contract  //40
     * nft_id,      20
     * price_token,   28
     * price,       20

     * receipt, 28
     * buyer  44
     */

    let taskId_bytes = data_buf.slice(0,40);
    console.log('taskId', scValToNative(xdr.ScVal.fromXDR(taskId_bytes)));
    let networkid_bytes = data_buf.slice(40, 40+36);
    console.log('networkid', scValToNative(xdr.ScVal.fromXDR(networkid_bytes)));
    let contractAddr_byte = data_buf.slice(40+36, 40+36+40);
    console.log('contractAddr', scValToNative(xdr.ScVal.fromXDR(contractAddr_byte)));
    let functionCallData = data_buf.slice(40+36+40);

    let l= functionCallData.length;
    let buyer_byte = functionCallData.slice(l-44);
    console.log('buyer', scValToNative(xdr.ScVal.fromXDR(buyer_byte)));

    let receipt_byte = functionCallData.slice(l-44-28, l-44);
    console.log('receipt', scValToNative(xdr.ScVal.fromXDR(receipt_byte)));

    let price_byte = functionCallData.slice(l-44-28-20, l-44-28);
    console.log('price_byte', scValToNative(xdr.ScVal.fromXDR(price_byte)));

    let price_token_byte = functionCallData.slice(l-44-28-20-28, l-44-28-20);
    console.log('price_token_byte', scValToNative(xdr.ScVal.fromXDR(price_token_byte)));

    let nft_id = functionCallData.slice(l-44-28-20-28-20,l-44-28-20-28)
    console.log('nft_id', scValToNative(xdr.ScVal.fromXDR(nft_id)));

    let nft_contract_bytes = functionCallData.slice(l-44-28-20-28-20-40,l-44-28-20-28-20);
    console.log('nft_contract', scValToNative(xdr.ScVal.fromXDR(nft_contract_bytes)));

    let message_type = functionCallData.slice(0,l-44-28-20-28-20-40)
    console.log('message_type', scValToNative(xdr.ScVal.fromXDR(message_type)));


}

parseEncodeInfo();