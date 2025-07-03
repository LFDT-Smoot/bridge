let meta_data = require('./data_meta');
let config = require('../config');
let data = {
    messageData:{
        message_type:meta_data.messageType.CancelOrder,
        nft_contract:config.scAddr.nft,
        nft_id:config.cur_nft_id,
        price_token:"0000000000000000000000000000000000000000",
        price:1000000000000000000000,
        recipent:"BB4E992daA6a51872C15Bf9db8f072624b91D37B",//B9b35117b4d0124C893f9505F5a3C9e69144a3e2
        buyer:config.user3.PublicKey,
    },
    wmbReceive:meta_data.wmbReceive,
    evmChainId: meta_data.evm.chainId,
    evmScAddr: meta_data.evm.scAddr.toLowerCase(),
    taskId: 'fde15cce9ac7dcdc4f1b9e2142d32e0009f918f15b6cac56b7a5b7eb5c7510ba', //bytes32
    networkId: meta_data.stellar.chainId,
    contractAddr: meta_data.stellar.scAddr
}

module.exports = data;