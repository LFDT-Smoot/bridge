/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use crate::{storage_types::{DataKey, PeerChainData}};
use soroban_sdk::{Bytes, Env};

pub fn read_peer_data(env: &Env) -> PeerChainData {
    let key = DataKey::PeerChain;
    env.storage().instance().get(&key).unwrap()
}

pub fn write_peer_data(env: &Env, data: PeerChainData) {
    let key = DataKey::PeerChain;
    env.storage().instance().set(&key, &data)
}