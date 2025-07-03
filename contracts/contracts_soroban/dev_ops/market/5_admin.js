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


const admin = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("admin")
    ).setTimeout(30).build();
    await send_operation(sourceKeypair, server, builtTransaction);

};

const change_admin = async (newPublicKey) => {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("change_admin",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(new Address(newPublicKey), {type:'Address'}),
            )
    ).setTimeout(30).build();
    await send_operation(builtTransaction);
}

admin();

let newPublicKey = "";

//change_admin(newPublicKey);


