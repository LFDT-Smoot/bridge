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

const {cancel_order_data} = require('./messate_data');
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
        market_contract.call("cancel_order",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(new Buffer.from(cancel_order_data.orderKey,'hex')),

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

// d2816090b1a6d7454533299dd916edc4dae50a96a42679d0d01a8c17c09ed9a5

//let result_data = [0,0,0,14,0,0,0,10,119,109,98,82,101,99,101,105,118,101,0,0,0,0,0,14,0,0,0,11,67,97,110,99,101,108,79,114,100,101,114,0,0,0,0,18,0,0,0,1,164,67,79,83,106,150,5,72,84,47,230,138,62,8,75,126,247,45,166,179,212,198,84,122,107,235,173,241,135,238,179,200,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,34,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,1,226,64,0,0,0,13,0,0,0,20,187,78,153,45,170,106,81,135,44,21,191,157,184,240,114,98,75,145,211,123,0,0,0,18,0,0,0,0,0,0,0,0,207,162,38,68,10,91,52,15,0,21,37,157,153,0,131,166,134,63,37,184,227,238,75,155,40,2,176,105,174,170,100,13,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,95,145,0,0,0,18,0,0,0,1,240,163,130,32,247,29,227,46,238,166,230,195,136,176,76,218,130,185,208,154,159,147,48,232,209,199,73,80,252,5,239,189]
//parse_function_call_data(result_data);