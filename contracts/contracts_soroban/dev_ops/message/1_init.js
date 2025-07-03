
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

let message_sc = config.scAddr.message_bridge;
const meta_data = require('./data_meta');

let contract = new Contract(message_sc);
let chain_id = meta_data.stellar.chainId;

const run = async ()=> {
    const server = new rpc.Server(config.soroban_testUrl);

    let user1KeyPair = config.user1;

    const sourceKeypair = Keypair.fromSecret(config.user1.secret);


    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call("init",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(chain_id, {type:"u256"}),
            nativeToScVal([
                new Buffer.from(config.secp256k1.user1.pubKey),
                new Buffer.from(config.secp256k1.user2.pubKey),
                new Buffer.from(config.secp256k1.user3.pubKey),
                new Buffer.from(config.secp256k1.user4.pubKey),
                new Buffer.from(config.secp256k1.user5.pubKey),
                new Buffer.from(config.testPubKey[0],'hex'),
                new Buffer.from(config.testPubKey[1],'hex'),
                new Buffer.from(config.testPubKey[2],'hex'),
            ]),
            nativeToScVal(1, {type:"u128"}),
            xdr.ScVal.scvBytes(meta_data.evm.scAddr.toLowerCase()),
            nativeToScVal(meta_data.evm.chainId, {type:"u256"})

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

    try {
        let sendResponse = await server.sendTransaction(preparedTransaction);
        console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

        if (sendResponse.status === "PENDING") {
            let getResponse = await server.getTransaction(sendResponse.hash);
            // Poll `getTransaction` until the status is not "NOT_FOUND"
            while (getResponse.status === "NOT_FOUND") {
                console.log("Waiting for transaction confirmation...");
                // See if the transaction is complete
                getResponse = await server.getTransaction(sendResponse.hash);
                // Wait one second
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            console.log(`getTransaction response: ${JSON.stringify(getResponse)}`);

            if (getResponse.status === "SUCCESS") {
                // Make sure the transaction's resultMetaXDR is not empty
                if (!getResponse.resultMetaXdr) {
                    throw "Empty resultMetaXDR in getTransaction response";
                }
                // Find the return value from the contract and return it
                let transactionMeta = getResponse.resultMetaXdr;
                let returnValue = transactionMeta.v3().sorobanMeta().returnValue();
                console.log(`Transaction result: ${returnValue.value()}`);
            } else {
                throw `Transaction failed: ${getResponse.resultXdr}`;
            }
        } else {
            throw sendResponse.errorResultXdr;
        }
    } catch (err) {
        // Catch and report any errors we've thrown
        console.log("Sending transaction failed");
        console.log(JSON.stringify(err));
    }


}

run();
//b14fce8fb9b402ace384286259ddbdf20016aa62973a97f0a758fb20959b88cd
