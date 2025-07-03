let meta_data = require('./data_meta');
let config = require('../config');
let data = {
    messageData:{
        message_type:meta_data.messageType.UnlockNFT,
        nft_contract:config.scAddr.nft,
        nft_id:config.cur_nft_id,
        price_token:"",
        price:0,
        recipent:"",
        buyer:config.user3.PublicKey,
    },
    wmbReceive:meta_data.wmbReceive,
    evmChainId: meta_data.evm.chainId,
    evmScAddr: meta_data.evm.scAddr,
    taskId: 'fde15cce9ac7dcdc4f1b9e2142d32e0009f918f15b6cac56b7a5b7eb5c7510b7', //bytes32
    networkId: meta_data.stellar.chainId,
    contractAddr: meta_data.stellar.scAddr
}

module.exports = data;