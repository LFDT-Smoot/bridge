/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{Address, Env, U256};

use crate::storage_types::DataKey;

pub fn has_network_id(e: &Env) -> bool {
    let key = DataKey::CHAINID;
    e.storage().instance().has(&key)
}

pub fn read_network_id(e: &Env) -> U256 {
    let key = DataKey::CHAINID;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_network_id(e: &Env, id: &U256) {
    let key = DataKey::CHAINID;
    e.storage().instance().set(&key, id);
}
