/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::storage_types::DataKey;

use soroban_sdk::{Address, BytesN, Env, Bytes, panic_with_error};
use soroban_sdk::xdr::FromXdr;

pub fn zero_address(env: &Env) -> Address {
    Address::from_string_bytes(&Bytes::from_array(env, &[0u8; 32]))
}

pub fn read_owner(env: &Env, id: i128) -> Address {
    let key = DataKey::Owner(id);
    match env.storage().instance().get::<DataKey, Address>(&key) {
        Some(addr) => addr,
        None => zero_address(&env),
    }
}
pub fn has_owner(env: &Env, id: i128) -> bool {
    let key = DataKey::Owner(id);
    env.storage().instance().has(&key)
}

pub fn write_owner(env: &Env, id: i128, owner: Address) {
    let key = DataKey::Owner(id);
    env.storage().instance().set(&key, &owner);
}
pub fn remove_owner(env: &Env, id: i128) {
    let key = DataKey::Owner(id);
    env.storage().instance().remove(&key)
}

pub fn check_owner(env: &Env, auth: &Address, id: i128) {
    assert!(
        auth == &read_owner(env, id),
        "not the owner for token {}",
        id
    );
}
