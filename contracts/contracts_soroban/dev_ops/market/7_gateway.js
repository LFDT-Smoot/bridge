const config = require('../config');
const {
    Keypair,
    Contract,
    rpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr, StrKey,
} = require('@stellar/stellar-sdk');

const { tx_send, send_operation } = require('../common');


const server = new rpc.Server(config.soroban_testUrl);
let market_contract_address = config.scAddr.nft_market;
let market_contract = new Contract(market_contract_address);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);


const gate_way = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("gate_way")
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);
}

const update_gate_way = async (message_bridge_sc)=> {
    let gate_way_address = new Address(message_bridge_sc);

    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("update_gate_way",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(gate_way_address, {type:"Address"}),
            )
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);
}

//gate_way();

let message_bridge_sc = config.scAddr.message_bridge;
update_gate_way(message_bridge_sc);




