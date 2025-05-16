/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const stellarUtils = require("../utils/stellar/utils");

module.exports = class StellarRawTransModel {
	constructor(chainId = null, chainType = null, from, to, value, ) {
		this.txParams = {
			from: from,
			to: to,
			value: value
		};

		if (chainId) {
      this.txParams.chainId = '0x' + parseInt(chainId).toString(16);
    } else {
			this.txParams.chainId = global.testnet ? '0xaa36a7' : '0x01';
		}
    this.chainType = chainType;
	}

	setNonce(nonce){
		//Do nothing
	}

	setGasPrice(gasPrice) {
		//Do nothing
	}

	setGasLimit(gasLimit) {
		//Do nothing
	}

	setData(data){  // the data argument is the one that return from getRelayTaskData()
		this.data = data;
		this.txParams.data = data;
	}

	setValue(value) {
		this.value = value;
		this.txParams.value = value;
	}

	/**
	 *
	 * @param seed
	 * @returns {null}
	 */
	sign(seed) {
		let ret = null;
		console.log('sign using private key: ', seed);
		let keyPair =  stellarUtils.getKeyPairFromEd25519Seed(seed);
		this.data.sign(keyPair);  // Note: `this.data` is the one that getRelayTaskData() return.
		return this.data;
	}

	// /**
	//  *  Sign the Tx data and return sign result.
	//  *
	//  * @param password
	//  * @param keyStoreDir
	//  * @returns {null|*}
	//  */
	// signFromKeystore(password, keyStoreDir = null){
	// 	let privateKey = EthUtils.getPrivateKey(password, this.txParams.from, keyStoreDir);
	// 	if(privateKey){
	// 		return this.sign(privateKey);
	// 	} else {
	// 		return null;
	// 	}
	// }
	//
	// getPrivateKeyStr(password, address) {
	// 	let privateKey;
	// 	privateKey = EthUtils.getPrivateKey(password, address, null);
	// 	return privateKey.toString('hex');
	// }
}
