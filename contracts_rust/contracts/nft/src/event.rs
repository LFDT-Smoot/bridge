/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

use soroban_sdk::{symbol_short, Env, Address};

pub(crate) fn transfer(e: &Env, from: Address, to: Address, id: i128) {
    let topics = (symbol_short!("transfer"), );
    e.events().publish(topics, (from, to, id));
}

pub(crate) fn set_admin(e: &Env, admin: Address, new_admin: Address) {
    let topics = (symbol_short!("set_admin"), admin);
    e.events().publish(topics, new_admin);
}

pub(crate) fn mint(e: &Env, admin:Address, to: Address, id: i128) {
    let topics = (symbol_short!("mint"),);
    e.events().publish(topics, (admin, to, id));
}

pub(crate) fn burn(e: &Env, from: Address, id: i128) {
    let topics = (symbol_short!("burn"),);
    e.events().publish(topics, (from, id));
}

pub(crate) fn approve(e: &Env, from: Address, to: Address, id: i128) {
    let topics = (symbol_short!("approve"),);
    e.events().publish(topics, (from, to, id));
}

pub(crate) fn approve_all(e: &Env, to: Address, from: Address) {
    let topics = (symbol_short!("appro_all"), );
    e.events().publish(topics, (to, from));
}
