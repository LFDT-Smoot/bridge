/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::owner::zero_address;
use crate::storage_types::DataKey;
use crate::storage_types::{ApprovalAll, ApprovalKey};

use soroban_sdk::{Env, Address};

pub fn read_approval(env: &Env, id: i128) -> Address {
    let key = DataKey::Approval(ApprovalKey::ID(id));
    if let Some(approval) = env.storage().instance().get::<DataKey, Address>(&key) {
        approval
    } else {
        zero_address(&env)
    }
}

pub fn remove_approval(env: &Env , id: i128) {
    let key = DataKey::Approval(ApprovalKey::ID(id));
    env.storage().instance().remove(&key);
}

pub fn read_approval_all(env: &Env, owner: Address, operator: Address) -> bool {
    let key = DataKey::Approval(ApprovalKey::All(ApprovalAll { operator, owner }));
    if let Some(approval) = env.storage().instance().get::<DataKey, bool>(&key) {
        approval
    } else {
        false
    }
}
pub fn remove_approval_all(env: &Env , owner: Address, operator: Address) {
    let key = DataKey::Approval(ApprovalKey::All(ApprovalAll { operator, owner }));
    env.storage().instance().remove(&key);
}

pub fn write_approval(env: &Env, id: i128, operator: Address) {
    let key = DataKey::Approval(ApprovalKey::ID(id));
    env.storage().instance().set(&key, &operator);
}

pub fn write_approval_all(env: &Env, owner: Address, operator: Address, approved: bool) {
    let key = DataKey::Approval(ApprovalKey::All(ApprovalAll { operator, owner }));
    env.storage().instance().set(&key, &approved);
}
