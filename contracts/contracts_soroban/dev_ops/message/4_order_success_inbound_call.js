
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


 data = require('./data_order_success_template');


const {
    getEncodeInfo, get_encoded_proof
} = require('./data_utils');
let { tx_send, getKeyPairFromKs} = require('../common');
const {Buffer} = require('node:buffer');
const crypto = require('node:crypto');
const secp256k1 = require('secp256k1');
const {keccak256} = require("ethereumjs-util");

let message_sc = config.scAddr.message_bridge;
let data_meta = require('./data_meta');
const meta_data = require("./data_meta");
let contract = new Contract(message_sc);
let chain_id = meta_data.stellar.chainId;
const server = new rpc.Server(config.soroban_testUrl);


const sourceKeypair = Keypair.fromSecret(config.user1.secret);



let nft_contract_addr = "43414b335955345252544c364246484b364553354e373334364f564b5a4754564f34584e504b564257514d53345554364e50584c34494548";
nft_contract_addr = "434236535a565541464b424f53574e524433535134533432445437554e354f4a335749415850454c5a37544e4e514c343434454f564b494a";
let nft_contract1 = new Buffer.from(nft_contract_addr,'hex').toString();
console.log('nft_contract1: ', nft_contract1)
let byer_addr= "4744484348465a56554d4f4657544c3453365034543632425257335945434a553259325847414d4a5541514f354745505147574248494645";
byer_addr = "4744475242484d5157324e534c5252424241335a41484c454857584a3537454c37425037474150554c41545648434d573255505252374541"
let buyer1 = new Buffer.from(byer_addr,'hex').toString();
console.log('buyer1', buyer1);

/*
data = {
    messageData:{
        message_type:"OrderSuccess",
        nft_contract:nft_contract1,
        nft_id:50006,
        price_token:"0000000000000000000000000000000000000000",
        price:10000000000000000,
        recipent:"D837BBcd310B2910eA89F2E064Ab4dA91C8357bb",
        buyer:buyer1,
    },
    wmbReceive:"wmbReceive",
    evmChainId: 2147484614,
    evmScAddr: "77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1",//77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1
    taskId: '888386c70925183765efd0fa40bf49d29ad6c0c335b6ae0481c0389ddb1b4969', //bytes32
    networkId: meta_data.stellar.chainId,
    contractAddr: meta_data.stellar.scAddr
}
*/

data = {
    messageData:{
        message_type:"OrderSuccess",
        nft_contract:nft_contract1,
        nft_id:60001,
        price_token:"0000000000000000000000000000000000000000",
        price:123000000000000000,
        recipent:"1bBdd8f1b9755548136247448Ce49AEcC20AB13b",
        buyer:buyer1,
    },
    wmbReceive:"wmbReceive",
    evmChainId: 2147484614,
    evmScAddr: "77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1",//77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1
    taskId: '41e11b099a05080fe1639c65c7b74d920653ed9637c89f3fbb3410d61878550e', //bytes32
    networkId: meta_data.stellar.chainId,
    contractAddr: meta_data.stellar.scAddr
}


const run = async ()=> {



    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());

    let encodeInfo = getEncodeInfo(data);
    const sha256hash = keccak256(encodeInfo)

    let testPrivkey = [89,147,122,71,157,114,182,85,141,123,194,123,223,107,252,86,249,216,50,185,169,63,152,87,56,84,188,163,83,232,60,149]
    const user1_secp256k1_privKey = Buffer.from(config.secp256k1.privKey, 'hex');



    let user1_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user1_secp256k1_privKey);

    console.log("user1_secp256k1_signagure.signature, ", user1_secp256k1_signagure.signature);
    console.log("user1_secp256k1_signagure.recid, ", user1_secp256k1_signagure.recid);
/*
    const user2_secp256k1_privKey = Buffer.from(config.secp256k1.user2.privKey,'hex');
    let user2_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user2_secp256k1_privKey);
    console.log("user2_secp256k1_signagure.signature, ", user2_secp256k1_signagure.signature);
    console.log("user2_secp256k1_signagure.recid, ", user2_secp256k1_signagure.recid);

    const user3_secp256k1_privKey = Buffer.from(config.secp256k1.user3.privKey,'hex');
    let user3_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user3_secp256k1_privKey);
    console.log("user3_secp256k1_signagure.signature, ", user3_secp256k1_signagure.signature);
    console.log("user3_secp256k1_signagure.recid, ", user3_secp256k1_signagure.recid);*/



    let encode_proof = get_encoded_proof([user1_secp256k1_signagure]);

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

    const sha256hash = keccak256(encodeInfo)
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


