const {scValToNative, Address, Keypair} = require("@stellar/stellar-sdk");
const {ethers } = require('ethers');
const ethUtil = require('ethereumjs-util');
const bip39 = require('bip39');
const crypto = require('crypto');
const send_operation = async (sourceKeypair, server, builtTransaction)=>{
    console.log(`builtTransaction=${builtTransaction.toXDR()}`);
    let preparedTransaction = await server.prepareTransaction(builtTransaction);
    console.log('preparedTransaction is: ', preparedTransaction);
    preparedTransaction.sign(sourceKeypair);
    console.log(`Signed prepared transaction XDR: ${preparedTransaction.toEnvelope().toXDR("base64")}`,);
    await tx_send(server, preparedTransaction);
}

const tx_send = async (server, preparedTransaction)=> {
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
                console.log('Transaction result is: ', scValToNative(returnValue));
             /*   let re = scValToNative(returnValue);
                for(let owner of re){
                    console.log(owner.toString('hex'));
                }*/

                console.log(returnValue.value()[1]);
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

async function getPkfromKs(json, passwd) {
    let wallet = await ethers.Wallet.fromEncryptedJson(json, passwd );

    return wallet.publicKey;
}

function hexTrip0x(hexs) {
    if (hexs && (0 == hexs.indexOf('0x'))) {
        return hexs.slice(2);
    }
    return hexs;
}

function hexAdd0x(hexs) {
    if (hexs && (0 != hexs.indexOf('0x'))) {
        return '0x' + hexs;
    }
    return hexs;
}
function sha256(params, type = 'buf') {
    let hash;
    if (type === 'uint8Array') {
        hash = crypto.createHash("sha256").update(toByteArray(params));
    } else {
        let kBuf = Buffer.from(params.slice(2), 'hex');
        hash = crypto.createHash("sha256").update(kBuf);
    }

    return '0x' + hash.digest("hex");
}



async function getKeyPairFromKs(json, passwd) {
    let wallet = await ethers.Wallet.fromEncryptedJson(json, passwd );
    console.log('wallet: ', wallet);
    let privateKey = wallet.privateKey;
    console.log("private: ", privateKey);
    let kp =  Keypair.fromRawEd25519Seed(new Buffer.from(hexTrip0x(privateKey),'hex'));
    console.log(kp.publicKey());
    return kp;

}

function isValidEVMAddress(address) {
    try {
        let validate;
        if (/^0x[0-9a-f]{40}$/.test(address.toLowerCase())) {
            validate = true;
        } else {
            validate = false;
        }
        return validate;
    } catch (err) {
        console.error("isValidEVMAddress Error:", err);
        return false;
    }
}

function convertToEthAddress(addr) {
    if (isValidEVMAddress(addr)) {
        return addr.toLowerCase();
    }

    const keccak256Hash = ethUtil.keccak256(addr);
    const addressBuffer = keccak256Hash.slice(-20);
    const ethAddress = '0x' + addressBuffer.toString('hex');

    return ethAddress;
}

module.exports  = {
    tx_send,send_operation, getPkfromKs, convertToEthAddress, isValidEVMAddress, getKeyPairFromKs

}