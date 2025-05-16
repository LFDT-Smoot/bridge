/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

use soroban_sdk::{Address, Bytes, BytesN, Env, U256, Vec, vec};

use crate::storage_types::{DataKey};

pub fn has_pubkey_count(e: &Env) -> bool {
    let key = DataKey::Secp256k1PubKeyCount;
    e.storage().instance().has(&key)
}

pub fn read_pubkey_count(e: &Env) -> u128 {
    let key = DataKey::Secp256k1PubKeyCount;
    match e.storage().instance().get::<DataKey, u128>(&key) {
        Some(count) => count,
        None => 0,
    }
}

pub fn write_pubkey_count(e: &Env, count: u128) {
    let key = DataKey::Secp256k1PubKeyCount;
    e.storage().instance().set(&key, &count);
}


pub fn has_pubkey_no(e:&Env, no:u128) -> bool{
    let key = DataKey::Secp256k1PubKeyNo(no);
    e.storage().instance().has(&key)
}
pub fn read_pubkey_no(e: &Env, no:u128) -> BytesN<65> {
    let key = DataKey::Secp256k1PubKeyNo(no);
    e.storage().instance().get(&key).unwrap()
}
pub fn write_pubkey_no(e: &Env, no:u128, order_key:BytesN<65>) {
    let key = DataKey::Secp256k1PubKeyNo(no);
    e.storage().instance().set(&key, &order_key);
}
pub fn remove_pubkey_no(e: &Env, no:u128) {
    let key = DataKey::Secp256k1PubKeyNo(no);
    e.storage().instance().remove(&key)
}

pub fn add_pubkey(e: &Env, pub_key: BytesN<65>) {
    let count = read_pubkey_count(e);
    let no = count + 1;
    write_pubkey_no(e, no, pub_key);
    write_pubkey_count(e, no);
}
pub fn delete_pubkey(e: &Env, pub_key: BytesN<65>) {
    let count = read_pubkey_count(e);
    let mut no = 0;
    for i in 1..count+1 {
        let tmp_pub_key = read_pubkey_no(e, i);
        if tmp_pub_key == pub_key {
            no = i;
            break;
        }
    }
    if no == count {
        remove_pubkey_no(e, no);
        write_pubkey_count(e, count-1);
    }else if no == 0 {
        panic!("no find order_key")
    }else {
        let tmp_pub_key = read_pubkey_no(e, count);
        write_pubkey_no(e, no,tmp_pub_key);
        remove_pubkey_no(e, count);
        write_pubkey_count(e, count-1);
    }
}

pub fn find_pubkey(e: &Env, order_key: BytesN<65>)-> u128 {
    let count = read_pubkey_count(e);
    let mut no = 0;
    for i in 1..count+1 {
        let tmp_pub_key = read_pubkey_no(e, i);
        if tmp_pub_key == order_key {
            no = i;
            break;
        }
    }
    no
}

pub fn list_pubkey(e: &Env) -> Vec<BytesN<65>> {
    let count = read_pubkey_count(e);
    let mut pubkey_vec:Vec<BytesN<65>> = vec![&e,];
    for i in 1..count+1 {
        let tmp_pub_key = read_pubkey_no(e, i);
        pubkey_vec.push_back(tmp_pub_key);
    }
    pubkey_vec
}
