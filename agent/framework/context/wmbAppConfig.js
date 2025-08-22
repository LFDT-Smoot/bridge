/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

/**
 * Configuration for WmbApp Associated Smart Contract Addresses
 * This file contains contract addresses that can identify a WmbApp across different chains
 */
const WmbAppLookupTable = {

    // Keys are dApp names, should match with the key used in setWmbAppConverter() inside the context's initialize.js
    "NftMarket" : [ // need to change to real WmbApp contract address
          "0x7349B7e4baea99d499DEFC0B41f88500630e781A",               // App On Matic
          "CAD5TR3KQNGPAZUIKKHQ7WHFMNBDIZ5JK4EJDOFKHBPCEBXHKYFBUUP7"  // App On Stellar
    ]

}

module.exports = {
  WmbAppLookupTable: WmbAppLookupTable
};