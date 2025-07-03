const {ethers } = require('ethers');
const ethUtil = require('ethereumjs-util');
async function getPkfromKs(json, passwd) {
    let wallet = await ethers.Wallet.fromEncryptedJson(json, passwd );
    return wallet.publicKey;
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
function getWalletfromWords(words) {
    let wallet = ethers.HDNodeWallet.fromPhrase(words);
    console.log("privateKey: ", wallet.privateKey);
    console.log('publicKey: ', wallet.publicKey);
    console.log('address: ', wallet.address);
}

module.exports  = {
     getPkfromKs, convertToEthAddress, isValidEVMAddress, getWalletfromWords

}