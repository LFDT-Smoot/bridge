/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{Address, Bytes, BytesN, Env, U256};


use crate::storage_types::{DataKey, NonceDataKey};

pub fn has_nonce(e: &Env,     source_chain_id : U256, dst_chain_id: U256, source_contract:Address, target_contract: Bytes) -> bool {
    let key = DataKey::NONCE(NonceDataKey{ source_chain_id, dst_chain_id, source_contract, target_contract});
    e.storage().instance().has(&key)
}

pub fn read_nonce(e: &Env, source_chain_id : U256, dst_chain_id: U256, source_contract:Address, target_contract: Bytes) -> u128 {
    let key = DataKey::NONCE(NonceDataKey{ source_chain_id, dst_chain_id, source_contract, target_contract});
    match e.storage().instance().get::<DataKey, u128>(&key) {
        Some(nonce) => nonce,
        None => 0,
    }
}
pub fn write_nonce(e: &Env, source_chain_id : U256, dst_chain_id: U256, source_contract:Address, target_contract: Bytes, nonce: u128) {
    let key = DataKey::NONCE(NonceDataKey{ source_chain_id, dst_chain_id, source_contract, target_contract});
    e.storage().instance().set(&key, &nonce);
}