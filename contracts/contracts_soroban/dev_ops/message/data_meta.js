let config = require('../config');
let meta_data = {
    stellar:{
        chainId: 2147483796,
        scAddr: config.scAddr.nft_market // nft_market contract address
    },

    evm:config.peerEvm,
    messageType:{
        OrderSuccess:"OrderSuccess",
        UnlockNFT:"UnlockNFT",
        CancelOrder:"CancelSuccess",
    },
    wmbReceive:"wmbReceive"
};
module.exports = meta_data;
