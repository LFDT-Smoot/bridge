
const config = require("../config");
let create_order_data ={
    message_type:"CreateOrder",
    nft_contract:config.scAddr.nft,
    nft_id:config.cur_nft_id,
    price_token:"0000000000000000000000000000000000000000",
    price:1000000000000000000000,
    recipent:"BB4E992daA6a51872C15Bf9db8f072624b91D37B",
    buyer:config.user3.PublicKey,
}

let cancel_order_data = {
    orderKey: "26213d8c1a55cddbffdb2fc66d71a903d52b9bc4e721e9ee7c5bc7121c80aa00"  //  [104,98,207,39,127,207,129,128,234,47,97,242,190,142,60,30,96,102,174,103,44,246,185,174,149,224,22,92,29,109,102,201]
}

module.exports = {
    create_order_data, cancel_order_data
}
