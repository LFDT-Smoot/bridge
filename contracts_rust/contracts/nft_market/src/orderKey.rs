/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{Address, Bytes, BytesN, Env, U256};


use crate::storage_types::{DataKey, MessageData};

pub fn has_order_key(e: &Env, order_key:BytesN<32>) -> bool {
    let key = DataKey::OrderKey(order_key);
    e.storage().instance().has(&key)
}

pub fn read_order_key(e: &Env, order_key: BytesN<32>) -> (MessageData, Address) {
    let key = DataKey::OrderKey(order_key);
    e.storage().instance().get(&key).unwrap()
}

pub fn write_order_key(e: &Env, order_key:BytesN<32>, message_data:MessageData, owner: Address) {
    let key = DataKey::OrderKey(order_key);
    e.storage().instance().set(&key, &(message_data, owner));
}
pub fn remove_order_key(e: &Env, order_key:BytesN<32>) {
    let key = DataKey::OrderKey(order_key);
    e.storage().instance().remove(&key)
}

