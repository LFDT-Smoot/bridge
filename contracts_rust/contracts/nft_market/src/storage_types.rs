/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{contracttype, Address, U256, Vec, String, Bytes, BytesN};
use soroban_sdk::crypto::Hash;


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MessageData {
    pub messageType: String,
    pub nftContract:Address,  //32
    pub nftId: i128,         //16
    pub priceToken: Bytes, //20
    pub price: i128,         //16
    pub recipient: Bytes,  //evm address 20
    pub buyer:Address,    // stellar address 32
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PeerChainData {
    pub evm_chain_id: U256,
    pub evm_chain_sc: Bytes
}



#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    GateWay,
    OrderKey(BytesN<32>),
    OrderCount,
    OrderNo(u128),
    PeerChain,
    OrderOwner(BytesN<32>)
}
