/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{Address, Bytes, BytesN, Env, U256};


use crate::storage_types::{DataKey, };

pub fn has_task_key(e: &Env, task_id:Bytes) -> bool {
    let key = DataKey::MessageExecuted(task_id);
    e.storage().instance().has(&key)
}

pub fn read_task_key(e: &Env, task_id: Bytes) -> bool {
    let key = DataKey::MessageExecuted(task_id);
    e.storage().instance().get(&key).unwrap()
}

pub fn write_task_key(e: &Env, task_id:Bytes) {
    let key = DataKey::MessageExecuted(task_id);
    let ret = true;
    e.storage().instance().set(&key, &ret);
}
pub fn remove_task_key(e: &Env, task_id:Bytes) {
    let key = DataKey::MessageExecuted(task_id);
    e.storage().instance().remove(&key)
}