const {MessageData, FunctionCallData, InboundFunctionCallData, EncodeInfo} = require("../InboundCallFunctionCallData");

const {xdr, ScInt} = require("@stellar/stellar-sdk");
const getEncodeInfo =  (data)=> {

    let messageData = new MessageData(data.messageData.message_type,
        data.messageData.nft_contract,
        data.messageData.nft_id,
        data.messageData.price_token,
        data.messageData.price,
        data.messageData.recipent,
        data.messageData.buyer);

    let messageDataByte = messageData.toXdrBytes();
    console.log('messageDataByte: ', messageDataByte);

    let funcationCallData =new FunctionCallData(data.wmbReceive, messageDataByte)

    let funcationCallDataByte = funcationCallData.toXdrBytes();
    console.log('funcationCallDataBytes: ', funcationCallDataByte)


    let inbouCallData = new InboundFunctionCallData(funcationCallDataByte, data.evmChainId, data.evmScAddr);
    let inboundCallDataBytes = inbouCallData.toXdrBytes();
    console.log('inboundCallDataBytes: ', inboundCallDataBytes);
    let encodeInfo = new EncodeInfo(inboundCallDataBytes,data.taskId, data.networkId, data.contractAddr);

    return encodeInfo.toXdrBytes();

}

const get_encoded_proof = (secp256k1_signagures)=> {
    let ScVal = xdr.ScVal;
    let values = [];
    for(let i = 0; i < secp256k1_signagures.length; i++) {

        let data = secp256k1_signagures[i];
        let jsOrig = ScVal.scvMap([
            new xdr.ScMapEntry({
                key:ScVal.scvSymbol('recid'),
                val:new ScInt(data.recid).toU128(),
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('signature'),
                val: ScVal.scvBytes(data.signature)
            }),
        ]);

        values.push(jsOrig);
    }

    let totalJsOrig = ScVal.scvMap([
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('signatures'),
            val: ScVal.scvVec(values)
        })
    ])

    return totalJsOrig.toXDR();



}

module.exports = {
    getEncodeInfo, get_encoded_proof
}
