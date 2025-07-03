const abi_nft_market = require("./abi/nft_market.json");
const abi_web_gate_way = require('./abi/wmb_gate_way.json');
const abi_multi_sig_verifier = require('./abi/multi_sig_verifier.json');
let config = {
    nodeUrl:'https://rpc-amoy.polygon.technology',
    abi:{
        nftMarket:abi_nft_market,
        webGateWay: abi_web_gate_way,
        multiSigVerifier:abi_multi_sig_verifier
    },
    scAddr:{
        nftMarket:"0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2",
        webGateWay:"0x01515a9cFcB38030c1C5B82827C03b881D825F54",
        multiSigVerifier:"0xe61f14fa151c2521Cc0fAD8DfDcB5fb525D9B92d",
    },
    stellarScAddr:{
        nft_market:"CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
        
    }
}

module.exports = config;