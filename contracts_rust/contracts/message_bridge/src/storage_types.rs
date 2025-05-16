/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{contracttype, Address, U256, Bytes, Map, BytesN};



#[derive(Clone)]
#[contracttype]
pub struct NonceDataKey {
    pub source_chain_id : U256,
    pub dst_chain_id: U256,
    pub source_contract:Address,
    pub target_contract: Bytes,
}


#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    CHAINID,
    VERIFIER,
    NONCE(NonceDataKey),
    MessageExecuted(Bytes),
    Threshold,
    Secp256k1PubKeyCount,
    Secp256k1PubKeyNo(u128),
    PeerChain

}




#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PeerChainData {
    pub evm_chain_id: U256,
    pub evm_chain_sc: Bytes
}
