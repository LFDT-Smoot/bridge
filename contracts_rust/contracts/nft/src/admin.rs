/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::storage_types::DataKey;

use soroban_sdk::{Env,Address};


pub fn has_administrator(env: &Env) -> bool {
    let key = DataKey::Admin;
    env.storage().instance().has(&key)
}

pub fn read_administrator(env: &Env) ->  Address {
    let key = DataKey::Admin;
    env.storage().instance().get(&key).unwrap()
}

pub fn write_administrator(env: &Env, id: Address) {
    let key = DataKey::Admin;
    env.storage().instance().set(&key, &id);
}

pub fn check_admin(env: &Env, auth: &Address) {

    assert_eq!(*auth, read_administrator(env), "not authorized by admin");
}
