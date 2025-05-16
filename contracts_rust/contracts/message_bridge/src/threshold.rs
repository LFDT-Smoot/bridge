/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{ Env};

use crate::storage_types::DataKey;

pub fn has_threshold(e: &Env) -> bool {
    let key = DataKey::Threshold;
    e.storage().instance().has(&key)
}

pub fn read_threshold(e: &Env) -> u128 {
    let key = DataKey::Threshold;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_threshold(e: &Env, num: u128) {
    let key = DataKey::Threshold;
    e.storage().instance().set(&key, &num);
}
