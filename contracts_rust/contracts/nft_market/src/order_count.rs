/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{ Env,   BytesN};


use crate::storage_types::DataKey;

pub fn has_order_count(e: &Env) -> bool {
    let key = DataKey::OrderCount;
    e.storage().instance().has(&key)
}

pub fn read_order_count(e: &Env) -> u128 {
    let key = DataKey::OrderCount;
    match e.storage().instance().get::<DataKey, u128>(&key) {
        Some(count) => count,
        None => 0,
    }
}

pub fn write_order_count(e: &Env, count: u128) {
    let key = DataKey::OrderCount;
    e.storage().instance().set(&key, &count);
}

pub fn has_order_no(e:&Env, no:u128) -> bool{
    let key = DataKey::OrderNo(no);
    e.storage().instance().has(&key)
}
pub fn read_order_no(e: &Env, no:u128) -> BytesN<32> {
    let key = DataKey::OrderNo(no);
    e.storage().instance().get(&key).unwrap()
}
pub fn write_order_no(e: &Env, no:u128, order_key:BytesN<32>) {
    let key = DataKey::OrderNo(no);
    e.storage().instance().set(&key, &order_key);
}
pub fn remove_order_no(e: &Env, no:u128) {
    let key = DataKey::OrderNo(no);
    e.storage().instance().remove(&key)
}

pub fn add_order(e: &Env, order_key: BytesN<32>) {
    let count = read_order_count(e);
    let no = count + 1;
    write_order_no(e, no, order_key);
    write_order_count(e, no);
}
pub fn delete_order(e: &Env, order_key: BytesN<32>) {
    let count = read_order_count(e);
    let mut no = 0;
    for i in 1..count+1 {
        let tmp_order_key = read_order_no(e, i);
        if tmp_order_key == order_key {
            no = i;
            break;
        }
    }
    if no == count {
        remove_order_no(e, no);
        write_order_count(e, count-1)
    }else if no == 0 {
        panic!("no find order_key")
    }else {
        let tmp_order_key = read_order_no(e, count);
        write_order_no(e, no,tmp_order_key);
        remove_order_no(e, count);
        write_order_count(e, count-1)
    }
}