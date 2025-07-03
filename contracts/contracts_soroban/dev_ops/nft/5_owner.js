
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

let own = async (nft_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call(
            "owner",
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


const test_ret = ()=> {
    let data = [198,39,138,144,172,119,39,10,14,215,10,53,155,110,130,167,177,230,33,44,224,31,138,95,203,244,246,242,52,55,136,171]

    data = [207,162,38,68,10,91,52,15,0,21,37,157,153,0,131,166,134,63,37,184,227,238,75,155,40,2,176,105,174,170,100,13]
    let d = Buffer.from(data);
//console.log(d.toString());

    console.log(StrKey.encodeEd25519PublicKey(d));
    //console.log(StrKey.encodeContract(d));
}

own(nft_id);
//test_ret();
