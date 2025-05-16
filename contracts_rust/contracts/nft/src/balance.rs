/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::{interface::WriteType, storage_types::DataKey};

use soroban_sdk::{Env,Address};

pub fn read_balance(env: &Env, owner: Address) -> i128 {
    let key = DataKey::Balance(owner);
    match env.storage().instance().get::<DataKey, i128>(&key) {
        Some(balance) => balance,
        None => 0,
    }
}

pub fn write_balance(env: &Env, owner: Address, write_type: WriteType) {
    let key = DataKey::Balance(owner.clone());
    let balance = read_balance(env, owner);

    match write_type {
        WriteType::Add => {
            let new_balance = balance + 1;
            env.storage().instance().set(&key, &new_balance)
        },
        WriteType::Remove => {
            let new_balance = balance - 1;
            env.storage().instance().set(&key, &new_balance)
        },
    }
}

pub fn read_supply(env: &Env) -> i128 {
    let key = DataKey::Supply;
    match env.storage().instance().get::<DataKey, i128>(&key) {
        Some(balance) => balance,
        None => 0,
    }
}

pub fn increment_supply(env: &Env) {
    let key = DataKey::Supply;
    let old_supply = read_supply(&env);
    let new_supply = old_supply + 1;
    env.storage().instance().set(&key,  &new_supply);
}


