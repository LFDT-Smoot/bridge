/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::{storage_types::{DataKey, Meta}};
use soroban_sdk::{Bytes, Env, String};

pub fn read_meta(env: &Env) -> Meta {
    let key = DataKey::Meta;
    env.storage().instance().get(&key).unwrap()
}

pub fn write_meta(env: &Env, data: Meta) {
    let key = DataKey::Meta;
    env.storage().instance().set(&key, &data)
}


pub fn read_base_uri(env: &Env)-> Bytes {
    let key = DataKey::BASEURI;
    env.storage().instance().get(&key).unwrap()
}
pub fn write_base_uri(env: &Env, uri:Bytes) {
    let key = DataKey::BASEURI;
    env.storage().instance().set(&key, &uri)
}

pub fn to_bytes(env: &Env, value: &str) -> Bytes {
    Bytes::from_slice(&env, value.as_bytes())
}
