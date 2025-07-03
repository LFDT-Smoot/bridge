
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



let { tx_send } = require('../common');


let message_sc = config.scAddr.message_bridge;

let contract = new Contract(message_sc);

const server = new rpc.Server(config.soroban_testUrl);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);

const run = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());


    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call("list_owner",
        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);
    // Sign the transaction with the source account's keypair.
    preparedTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );
    tx_send(server, preparedTransaction);
}



run();
//4a50a01af23f057d0a891bd9254786d367cf55a76afc97cead573a1fb035c9c5


