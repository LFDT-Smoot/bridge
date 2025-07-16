
const WalletAbstract = require('@framework/wallet/wallet-abstract');
const {hexTrip0x, hexAdd0x} = require("@framework/comm/lib.js");
const elliptic = require('elliptic');
const ethUtil = require('ethereumjs-util');

module.exports = class EthWallet extends WalletAbstract {
    constructor() {
        super();
        this._publicKey = null;
    }

    static getPublicKey(privateKey) {
        const ec = new elliptic.ec('secp256k1');

        let key = privateKey;

        if (typeof privateKey == String && key.indexOf('0x') === 0) {
            key = privateKey.slice(2);
        }

        const keyPair = ec.keyFromPrivate(key, 'hex');
        const publicKey = keyPair.getPublic('hex');

        return '0x' + publicKey;
    }

    static addressFromPublicKey(publicKey) {
        const prefixedKey = (publicKey.indexOf('0x') === 0) ? publicKey.slice(2) : '0x' + publicKey;

        const publicKeyBuffer = Buffer.from(prefixedKey, 'hex');

        const addressBuffer = ethUtil.publicToAddress(publicKeyBuffer, true);

        const address = ethUtil.bufferToHex(addressBuffer);

        return address;
    }

    static fromPrivate(privateKey) {
        let wallet = new EthWallet();
        wallet._privateKey = privateKey;
        wallet._publicKey = EthWallet.getPublicKey(privateKey);
        wallet._address = EthWallet.addressFromPublicKey(wallet._publicKey);
        return wallet;
    }

    publicKey() {
        return this._publicKey;
    }

    privateKey() {
        return this._privateKey;
    }
    address() {
        return this._address;
    }

    async sign(data) {
        let privateKeyBuffer = Buffer.from(hexTrip0x(this.privateKey()), 'hex');
        const signature = ethUtil.ecsign(data, privateKeyBuffer);

        const combinedSignature = ethUtil.toRpcSig(signature.v, signature.r, signature.s);

        let signResult = {
          sigR: hexAdd0x(signature.r.toString('hex')),
          sigS: hexAdd0x(signature.s.toString('hex')),
          sigV: signature.v,
          signature: combinedSignature
        }
        return signResult;
    }
}