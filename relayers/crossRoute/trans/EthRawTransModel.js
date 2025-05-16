/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

let ethTx = require('ethereumjs-tx');
let keyStore = require("../utils/keyStore.js");

const { FeeMarketEIP1559Transaction } = require( '@ethereumjs/tx' );

module.exports = class EthRawTransModel {
	constructor(from, to, gas, gasPrice, nonce, value, chainId = null, chainType = null) {
		this.txParams = {
			from: from,
			to: to,
			gasLimit: gas,
			nonce: nonce,
			value: value
		};

		if (gasPrice) {
			this.txParams.gasPrice = '0x' + gasPrice.toString(16);
		}

		if (this.txParams.gasLimit) {
			this.txParams.gasLimit = '0x' + this.txParams.gasLimit.toString(16);
		}

		if (chainId) {
      this.txParams.chainId = '0x' + parseInt(chainId).toString(16);
    } else {
			this.txParams.chainId = global.testnet ? '0xaa36a7' : '0x01';
		}
    this.chainType = chainType;
	}

	setNonce(nonce){
		this.txParams.nonce = nonce;
	}

	setGasPrice(gasPrice) {
		if (gasPrice instanceof Object && (gasPrice.maxFeePerGas || gasPrice.maxPriorityFeePerGas)) {
			if (gasPrice.maxFeePerGas) {
				this.txParams.maxFeePerGas = '0x' + gasPrice.maxFeePerGas.toString(16);
			}

			if (gasPrice.maxPriorityFeePerGas) {
				this.txParams.maxPriorityFeePerGas = '0x' + gasPrice.maxPriorityFeePerGas.toString(16);
			}
			delete this.txParams.gasPrice;
		} else {
			this.txParams.gasPrice = '0x' + gasPrice.toString(16);
		}
	}

	setGasLimit(gasLimit){
		this.txParams.gasLimit = '0x' + gasLimit.toString(16);
	}

	setData(data){
		this.data = data;
		this.txParams.data = data;
	}

	setValue(value) {
		this.value = value;
		this.txParams.value = value;
	}

	serialize(signature) {
		let tx;
		tx = new ethTx(this.txParams);
		Object.assign(tx, signature);

		const serializedTx = tx.serialize();
		return '0x' + serializedTx.toString('hex');
	}

	sign(privateKey) {
		let tx;
		let serializedTx;
		if (this.txParams.gasPrice) {
			tx = new ethTx(this.txParams);
			tx.sign(privateKey);
			serializedTx = tx.serialize();
		} else {
			tx = FeeMarketEIP1559Transaction.fromTxData(this.txParams);
			const signedTransaction = tx.sign(privateKey)
			serializedTx = signedTransaction.serialize();

			serializedTx = Array.from(serializedTx)
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		}

		return '0x' + serializedTx.toString('hex');
	}

	signFromKeystore(password, keyStoreDir = null){
		let privateKey;
		if (global.privateKey && global.privateKey[this.txParams.from]) {
			privateKey = global.privateKey[this.txParams.from];
		} else {
			if (keyStoreDir === null) {
				privateKey = keyStore.getPrivateKey(this.txParams.from, password);
			} else {
				privateKey = keyStoreDir.getAccount(this.txParams.from).getPrivateKey(password);
			}
			if (!global.privateKey) {
				global.privateKey = {};
			}
			global.privateKey[this.txParams.from] = privateKey;
		}

		if(privateKey){
			return this.sign(privateKey);
		} else {
			return null;
		}
	}

	getPrivateKey(password, address) {
		let privateKey;
		let addr = address ? address : this.txParams.from;
		if (global.privateKey && global.privateKey[addr]) {
			privateKey = global.privateKey[addr];
		} else {
			privateKey = keyStore.getPrivateKey(addr, password);
			if (!global.privateKey) {
				global.privateKey = {};
			}
			global.privateKey[addr] = privateKey;
		}

		return privateKey.toString('hex');
	}
}
