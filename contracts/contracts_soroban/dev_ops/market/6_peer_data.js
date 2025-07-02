const config = require('../config');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr, StrKey,
} = require('@stellar/stellar-sdk');

const { tx_send, send_operation } = require('../common');


const server = new SorobanRpc.Server(config.soroban_testUrl);
let market_contract_address = config.scAddr.nft_market;
let market_contract = new Contract(market_contract_address);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);


const peer_data = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("peer_data")
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);
}

const update_peer_data = async (evm_sc_addr, evm_chain_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("update_peer_data",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(new Buffer.from(evm_sc_addr,'hex')),
            nativeToScVal(evm_chain_id, {type:"u256"})
            )
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);
}

peer_data();
let evm_sc_addr = "";
let evm_chain_id = ""
