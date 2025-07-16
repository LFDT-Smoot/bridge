
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
    nativeToScVal, xdr
} = require("@stellar/stellar-sdk");



let contract = new Contract(config.scAddr.nft);
const server = new rpc.Server(config.soroban_testUrl);



const sourceKeypair = Keypair.fromSecret(config.user1.secret);



const {tx_send }= require("../common")

const burn = async (nft_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call(
            "burn",
            nativeToScVal(nft_id, {type:'i128'})

        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    //console.log('preparedTransaction is: ', preparedTransaction);

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
let nft_id = config.cur_nft_id;
burn(nft_id);

