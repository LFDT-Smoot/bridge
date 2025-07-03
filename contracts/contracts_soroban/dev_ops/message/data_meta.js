let config = require('../config');
let meta_data = {
    stellar:{
        chainId: 2147483796,
        scAddr: config.scAddr.nft_market // nft_market contract address
    },

    evm:{
        chainId: 2147484614,   //matic
        scAddr:'B9b35117b4d0124C893f9505F5a3C9e69144a3e2'   // NftMarket address: 0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2
    },
    messageType:{
        OrderSuccess:"OrderSuccess",
        UnlockNFT:"UnlockNFT",
        CancelOrder:"CancelSuccess",
    },
    wmbReceive:"wmbReceive"
};
module.exports = meta_data;
