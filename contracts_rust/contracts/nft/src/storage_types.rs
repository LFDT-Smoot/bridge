/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

use soroban_sdk::{contracttype, Address, Bytes};

#[derive(Clone)]
#[contracttype]
pub struct ApprovalAll {
    pub operator: Address,
    pub owner: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum ApprovalKey {
    All(ApprovalAll),
    ID(i128),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Meta {
    pub name: Bytes,
    pub symbol: Bytes,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balance(Address),
    Admin,
    Meta,
    URI(i128),
    BASEURI,
    Approval(ApprovalKey),
    Owner(i128),
    Supply,
}
