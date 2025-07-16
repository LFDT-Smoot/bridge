/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

module.exports = class RelayAbstract {
    constructor(config,logger = console) {
        this.logger = logger;
        this.config = config;
    }
    async signByApprove(hashX, signData, extData) {
        throw new Error("signByApprove() is not implemented");
    }
    async getForApprove(chainType = null) {
        throw new Error("getForApprove() is not implemented");
    }
    async approve(hashX, signData, extData) {
        throw new Error("approve() is not implemented");
    }

    // setHashX(hashX) {
    //     this.hashX = hashX;
    // }

    // setSignData(signData) {
    //     this.signData = signData;
    // }

    // setExtData(extData) {
    //     this.extData = extData;
    // }
}