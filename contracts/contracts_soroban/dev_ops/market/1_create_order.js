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
    nativeToScVal, xdr,
} = require('@stellar/stellar-sdk');

const { tx_send } = require('../common');
const {create_order_data} = require('./messate_data')

const server = new rpc.Server(config.soroban_testUrl);
let market_contract_address = config.scAddr.nft_market;
let market_contract = new Contract(market_contract_address);
const run = async ()=> {

    const sourceKeypair = Keypair.fromSecret(config.user1.secret);

    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("create_order",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(create_order_data.message_type, {type: "string"}),
            nativeToScVal(new Address(create_order_data.nft_contract), {type:"Address"}),
            nativeToScVal(create_order_data.nft_id, {type:"i128"}),
            xdr.ScVal.scvBytes(create_order_data.price_token),
            nativeToScVal(create_order_data.price, {type:'i128'}),
            xdr.ScVal.scvBytes(create_order_data.recipent),
            new Address(create_order_data.buyer).toScVal()
        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    console.log('preparedTransaction is: ', preparedTransaction);

    // Sign the transaction with the source account's keypair.
    preparedTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );

    await tx_send(server, preparedTransaction);

}

run();

// a209ab52b7b97c8b6b4f11eabcdf2a245fb62856d5d51b2b88fea41bcda39f17



// parse_function_call_data(result_data);