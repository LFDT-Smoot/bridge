/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#![no_std]
use soroban_sdk::{Address, Bytes, contractclient};

#[contractclient(name = "NftContractClient")]
pub trait NftContractInterface {

    fn admin(env: soroban_sdk::Env) -> Address;


    fn set_admin(
        env: soroban_sdk::Env,
        new_admin: Address,
    );


    fn name(env: soroban_sdk::Env) -> soroban_sdk::Bytes;


    fn symbol(env: soroban_sdk::Env) -> soroban_sdk::Bytes;


    fn token_uri(env: soroban_sdk::Env, id: i128) -> soroban_sdk::Bytes;


    fn approve(
        env: soroban_sdk::Env,
        from: Address,
        sender: Address,
        token_id: i128,
    );


    fn approve_all(
        env: soroban_sdk::Env,
        from: Address,
        sender: Address,
        approved: bool,
    );


    fn get_approve(env: soroban_sdk::Env, id: i128) -> Address;


    fn is_approve(
        env: soroban_sdk::Env,
        owner: Address,
        operator: Address,
    ) -> bool;

    fn balance(env: soroban_sdk::Env, owner: Address) -> i128;

    /// Get the owner of "id" token.
    fn owner(env: soroban_sdk::Env, id: i128) -> Address;


    fn transfer(
        env: soroban_sdk::Env,
        from: Address,
        to: Address,
        token_id: i128,
    );


    fn transfer_from(
        env: soroban_sdk::Env,
        spender: Address,
        from: Address,
        to: Address,
        token_id: i128,
    );


    fn mint(env: soroban_sdk::Env, to: Address, token_id: i128);

    fn burn(env: soroban_sdk::Env,token_id: i128);


    fn initialize(
        e: soroban_sdk::Env,
        admin: Address,
        name: soroban_sdk::Bytes,
        symbol: soroban_sdk::Bytes,
        base_uri:Bytes,
    );
}

