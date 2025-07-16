const { Keypair, } = require("@stellar/stellar-sdk");

const WalletAbstract = require('@framework/wallet/wallet-abstract');
const { hexTrip0x } = require('@framework/comm/lib');

module.exports = class StellarWallet extends WalletAbstract {
    constructor() {
        super();
        this._keyPair = null;
        this._seed = null;
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

    static fromPrivate(seed) {
        let wallet = new StellarWallet();
        const privKeyBuffer = new Buffer.from(hexTrip0x(seed), "hex");
        const keyPair = Keypair.fromRawEd25519Seed(privKeyBuffer);
        wallet._seed = hexTrip0x(seed);
        wallet._keyPair = keyPair;
        return wallet;
    }

    publicKey() {
        let pubKey = this._keyPair.publicKey();
        return pubKey;
    }

    address() {
        return this._keyPair.publicKey();
    }

    privateKey() {
        return this._seed;
    }

    async sign(message) {
        // TODO
        throw new Error('StellarWallet::sign() Not implemented');
        // return message;
    }

    // ----------------- inner member --------------------

    getAccountFromPrivateKey(privateKey) {
        const address = this.getPublicKeyFromPrivateKey(privateKey);
        return { address: address }
    }

    getPublicKeyFromPrivateKey(privateKey) {
        let keyPair = Keypair.fromSecret(privateKey);
        let pubKey = keyPair.publicKey();
        return pubKey;
    }

    getKeyPairFromPrivateKey(privateKey) {
        return Keypair.fromSecret(privateKey);
    }

    getKeyPairFromEd25519Seed(seed) {
        const privKeyBuffer = new Buffer.from(hexTrip0x(seed), "hex");
        const keyPair = Keypair.fromRawEd25519Seed(privKeyBuffer);
        return keyPair;
    }
}