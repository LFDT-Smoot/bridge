const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,ScInt,
    nativeToScVal, xdr, scValToNative
} = require("@stellar/stellar-sdk");

class MessageData {

    constructor(_message_type, _nft_contract, _nft_id, _price_token, _price, _recipent, _buyer) {
        this.message_type = _message_type;
        this.nft_contract = _nft_contract;
        this.nft_id = _nft_id;
        this.price_token = _price_token;
        this.price = _price;
        this.recipent = _recipent;
        this.buyer = _buyer;
    }

    toXdrBytes() {

        let ScVal = xdr.ScVal;
        let jsOrig = ScVal.scvMap([
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('buyer'),
                val: new Address(this.buyer).toScVal()
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('messageType'),
                val:ScVal.scvString(this.message_type)
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('nftContract'),
                val:new Address(this.nft_contract).toScVal()
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('nftId'),
                val: new ScInt(this.nft_id).toI128()
            }),
            new xdr.ScMapEntry({
                key:ScVal.scvSymbol('price'),
                val:new ScInt(this.price).toI128(),
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('priceToken'),
                val: ScVal.scvBytes(this.price_token)
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('recipent'),
                val: ScVal.scvBytes(this.recipent)
            }),

        ])
        return jsOrig.toXDR();
    }
}

class FunctionCallData {

    constructor(messageFunc, messageData) {
        this.messageFunc = messageFunc;
        this.messageData = messageData;
    }

    toXdrBytes(){
        let ScVal = xdr.ScVal;
        let jsOrig = ScVal.scvMap([
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('messageData'),
                val: ScVal.scvBytes(this.messageData)
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('messageFunc'),
                val:ScVal.scvSymbol(this.messageFunc)
            })
            ]
        );
        return jsOrig.toXDR();
    }

}

class InboundFunctionCallData {

    constructor(functionCallData, sourceChainId, sourceContract) {
        this.functionCallData = functionCallData;
        this.sourceChainId = sourceChainId;
        this.sourceContract = sourceContract;
    }

    toXdrBytes(){
        let ScVal = xdr.ScVal;

        let jsOrig = ScVal.scvMap([
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('contractAddress'),
                val: ScVal.scvBytes(this.sourceContract)
            }),
            new xdr.ScMapEntry({
                key:ScVal.scvSymbol('functionCallData'),
                val:ScVal.scvBytes(this.functionCallData)
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('networkId'),
                val: new ScInt(this.sourceChainId).toU256(),
            }),

        ]);
        return jsOrig.toXDR();
    }
}


class EncodeInfo {

    constructor(_inboundFunctionCallData, _taskId, _networkId, _contractAddr) {
        this.inboundFunctionCallData = _inboundFunctionCallData;
        this.taskId = _taskId;
        this.networkId = _networkId;
        this.contractAddr = _contractAddr;
    }

    toXdrBytes() {
        let ScVal = xdr.ScVal;

        let jsOrig = ScVal.scvMap([
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('contractAddress'),
                val:new Address(this.contractAddr).toScVal()
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('functionCallData'),
                val: ScVal.scvBytes(this.inboundFunctionCallData)
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('networkId'),
                val: new ScInt(this.networkId).toU256(),
            }),
            new xdr.ScMapEntry({
                key: ScVal.scvSymbol('taskId'),
                val: ScVal.scvBytes(this.taskId)
            }),
        ]);

        return jsOrig.toXDR();

    }
}


module.exports = {
    MessageData, InboundFunctionCallData, EncodeInfo, FunctionCallData
};