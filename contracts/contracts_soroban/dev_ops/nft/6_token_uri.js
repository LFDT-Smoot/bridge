
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
    nativeToScVal, xdr, scValToNative, StrKey
} = require("@stellar/stellar-sdk");

const {tx_send }= require("../common")

let contract = new Contract(config.scAddr.nft);
const server = new rpc.Server(config.soroban_testUrl);
const sourceKeypair = Keypair.fromSecret(config.user1.secret);

let token_uri = async (nft_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call(
            "token_uri",
            nativeToScVal(nft_id, {type:'i128'})

        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);
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

token_uri(nft_id);

const t_result = async ()=> {
    let data = [119,97,110,45,115,111,114,111,98,97,110,97,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,44];
    let buf_data = new Buffer.from(data);

    console.log(buf_data.toString());
}

//t_result();


