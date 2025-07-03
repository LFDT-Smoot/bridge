
const config = require('../config.js');
const {
    Keypair,
    Contract,
    rpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr, scValToNative
} = require("@stellar/stellar-sdk");



let { tx_send, send_operation} = require('../common');


let message_sc = config.scAddr.message_bridge;

let contract = new Contract(message_sc);
let data_meta = require("./data_meta.js");
const meta_data = require("./data_meta");

const server = new rpc.Server(config.soroban_testUrl);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);




const update_peer_data = async (evm_sc_addr, evm_chain_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call("change_peer_data",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            xdr.ScVal.scvBytes(evm_sc_addr),
            nativeToScVal(evm_chain_id, {type:"u256"})
        )
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);
}

update_peer_data(data_meta.evm.scAddr.toLowerCase(),data_meta.evm.chainId);







