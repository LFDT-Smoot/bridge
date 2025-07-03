/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

module.exports = class WalletAbstract {

    constructor(){
        // console.log('WalletAbstract constructor')
        // this._address = null;
        // this._privateKey = null;
    }

    async address(){
        throw new Error('ethAddress() Not implemented');
    }

    async publicKey(){
        throw new Error('publicKey() Not implemented');
    }

    async sign(data){
        throw new Error('sign() Not implemented');
    }
    async privateKey(){
        throw new Error('privateKey() Not implemented');
    }

}