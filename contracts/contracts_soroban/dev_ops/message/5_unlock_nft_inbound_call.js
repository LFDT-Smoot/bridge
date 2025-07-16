
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

const {
    MessageData, FunctionCallData, EncodeInfo, InboundFunctionCallData
} = require('../InboundCallFunctionCallData');
const data = require('./data_unlock_nft_template');

const {
    getEncodeInfo, get_encoded_proof
} = require('./data_utils');
let { tx_send } = require('../common');
const {Buffer} = require('node:buffer');
const crypto = require('node:crypto');
const secp256k1 = require('secp256k1');
const {keccak256} = require("ethereumjs-util");
const meta_data = require("./data_meta");

let message_sc = config.scAddr.message_bridge;
let contract = new Contract(message_sc);
let chain_id = meta_data.stellar.chainId;
const server = new rpc.Server(config.soroban_testUrl);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);



const run = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());

    let encodeInfo = getEncodeInfo(data);
    const sha256hash = keccak256(encodeInfo)

    const user1_secp256k1_privKey = Buffer.from(config.secp256k1.user1.privKey,'hex');
    let user1_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user1_secp256k1_privKey);
    console.log("user1_secp256k1_signagure.signature, ", user1_secp256k1_signagure.signature);
    console.log("user1_secp256k1_signagure.recid, ", user1_secp256k1_signagure.recid);

    const user2_secp256k1_privKey = Buffer.from(config.secp256k1.user2.privKey,'hex');
    let user2_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user2_secp256k1_privKey);
    console.log("user2_secp256k1_signagure.signature, ", user2_secp256k1_signagure.signature);
    console.log("user2_secp256k1_signagure.recid, ", user2_secp256k1_signagure.recid);


    const user3_secp256k1_privKey = Buffer.from(config.secp256k1.user3.privKey,'hex');
    let user3_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user3_secp256k1_privKey);
    console.log("user3_secp256k1_signagure.signature, ", user3_secp256k1_signagure.signature);
    console.log("user3_secp256k1_signagure.recid, ", user3_secp256k1_signagure.recid);



    let encode_proof = get_encoded_proof([user1_secp256k1_signagure,user2_secp256k1_signagure, user3_secp256k1_signagure]);

    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call("inbound_call",
            nativeToScVal(chain_id, {type:"u256"}),
            nativeToScVal(encodeInfo),
            nativeToScVal(encode_proof)
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


const local_recover = async ()=> {
    let encodeInfo = getEncodeInfo(data);
    const sha256hash_str = await crypto.createHash('sha256').update(encodeInfo).digest('hex');
    const sha256hash =  Buffer.from(sha256hash_str,'hex');

    const secp256k1_privKey = Buffer.from(config.secp256k1.privKey,'hex');
    let secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,secp256k1_privKey);
    console.log("secp256k1_signagure.signature, ", secp256k1_signagure.signature);
    console.log("secp256k1_signagure.recid, ", secp256k1_signagure.recid);

    console.log("secp256k1.public : ", secp256k1.ecdsaRecover(secp256k1_signagure.signature, secp256k1_signagure.recid, sha256hash,false));

    let recid =  nativeToScVal(secp256k1_signagure.recid, {type:'u32'});
    console.log(recid.toXDR());
    console.log(recid.toXDR().length);
}

run();
//4a50a01af23f057d0a891bd9254786d367cf55a76afc97cead573a1fb035c9c5


