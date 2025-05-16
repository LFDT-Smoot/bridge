/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#![no_std]

extern crate alloc;

use alloc::string::ToString;
use soroban_sdk::{contract, contractimpl, Env, Address, Bytes, TryFromVal, String};
use crate::interface::{NftContractInterface, WriteType};
use crate::admin::{ has_administrator, read_administrator, write_administrator};
use crate::metadata::{
    read_meta, write_meta, read_base_uri,write_base_uri,
};
use crate::owner::{check_owner, read_owner, write_owner, zero_address, has_owner, remove_owner};
use crate::storage_types::{ Meta};
use crate::event;
use crate::approval::{read_approval, read_approval_all, write_approval, write_approval_all, remove_approval};
use crate::balance::{
     increment_supply, read_balance,  write_balance,
};
#[cfg(test)]
use soroban_sdk::token::{ Interface as _};
use soroban_sdk::xdr::{FromXdr, ToXdr};


#[contract]
pub struct NftContract;



fn verify_auth(env: &Env, auth: &Address) {
    auth.require_auth();
}


#[contractimpl]
impl NftContractInterface for  NftContract {

    /// Initialize the contract with "admin" as administrator, "name" as the name, and
    /// "symbol" as the symbol.
    fn initialize(
        env: Env,
        admin: Address,
        name: Bytes,
        symbol: Bytes,
        base_uri:Bytes,
    ){
        assert!(!has_administrator(&env), "already initialized");
        write_administrator(&env, admin);
        let meta = Meta { name: name, symbol: symbol};
        write_meta(&env, meta);
        write_base_uri(&env, base_uri);
    }


    /// Returns the current administrator
    fn admin(env: Env) -> Address{
        read_administrator(&env)
    }

    /// If "admin" is the administrator, set the administrator to "new_admin".
    /// Emit event with topics = ["set_admin", admin: Identifier], data = [new_admin: Identifier]
    fn set_admin(env: Env,new_admin: Address){
        let admin = read_administrator(&env);
        verify_auth(&env, &admin);

        write_administrator(&env, new_admin.clone());
        event::set_admin(&env, admin, new_admin);
    }

    // --------------------------------------------------------------------------------
    // Metadata interface
    // --------------------------------------------------------------------------------

    // Get the name for this token.
    fn name(env: Env) -> soroban_sdk::Bytes{
        let meta = read_meta(&env);
        meta.name
    }

    // Get the symbol for this token.
    fn symbol(env: soroban_sdk::Env) -> soroban_sdk::Bytes{
        let meta = read_meta(&env);
        meta.symbol
    }

    // Get the uniform resource identifier for token "id".
    fn token_uri(env: Env, token_id: i128) -> soroban_sdk::Bytes{

        assert!(has_owner(&env, token_id.clone()),"token_id no owner ");
        let base_uri = read_base_uri(&env);

        let str_token_id = token_id.to_string();

        let mut uri_bytes = Bytes::new(&env);
        uri_bytes.append(&base_uri);
        uri_bytes.append(&Bytes::from_slice(&env,str_token_id.as_bytes()));
        uri_bytes


    }

    // --------------------------------------------------------------------------------
    // Token interface
    // --------------------------------------------------------------------------------

    /// Allows "operator" to manage token "id" if "owner" is the current owner of token "id".
    fn approve(
        env: Env,
        from: Address,
        spender: Address,
        token_id: i128,
    ){

        check_owner(&env, &from, token_id);
        verify_auth(&env, &from);

        write_approval(&env, token_id, spender.clone());

        event::approve(&env, from, spender, token_id);
    }

    /// If "approved", allows "operator" to manage all tokens of "owner"
    /// Emit event with topics = ["appr_all", operator: Identifier], data = [owner: Identifier]
    fn approve_all(
        env: Env,
        from: Address,
        spender: Address,
        approved: bool,
    ){
        verify_auth(&env, &from.clone());

        write_approval_all(&env, from.clone(), spender.clone(), approved);
        event::approve_all(&env, spender, from.clone())
    }

    /// Returns the identifier approved for token "id".
    fn get_approve(env: Env, token_id: i128) -> Address{
        read_approval(&env, token_id)
    }

    /// If "operator" is allowed to manage assets of "owner", return true.
    fn is_approve(
        env: Env,
        from: Address,
        spender: Address,
    ) -> bool{
        read_approval_all(&env, from, spender)
    }

    /// Get the balance of "id".
    fn balance(env: Env, owner: Address) -> i128{
        read_balance(&env, owner)
    }

    /// Get the owner of "id" token.
    fn owner(env: soroban_sdk::Env, id: i128) -> Address{
        read_owner(&env, id)
    }

    /// Transfer token "id" from "from" to "to.
    /// Emit event with topics = ["transfer", from: Identifier, to: Identifier], data = [id: i128]
    fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: i128,
    ){

        env.events().publish(("transfer","in transfer"), (from.clone(), to.clone(), token_id.clone()));

        check_owner(&env, &from.clone(), token_id.clone());
        verify_auth(&env, &from.clone());


        remove_approval(&env, token_id.clone());
        write_owner(&env, token_id.clone(), to.clone());
        write_balance(&env, from.clone(), WriteType::Remove);
        write_balance(&env, to.clone(), WriteType::Add);

        event::transfer(&env, from.clone(), to, token_id);
    }


    fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        token_id: i128,
    ){
        check_owner(&env, &from, token_id.clone());
        verify_auth(&env, &spender);

        if spender == read_approval(&env, token_id.clone())
            || read_approval_all(&env, from.clone(), spender)
        {
            remove_approval(&env, token_id.clone());
            write_owner(&env, token_id.clone(), to.clone());
            write_balance(&env, from.clone(), WriteType::Remove);
            write_balance(&env, to.clone(), WriteType::Add);

            event::transfer(&env, from, to, token_id);
        } else {
            panic!("not approved")
        }
    }


    fn mint(env: Env, to: Address, token_id: i128){
        let admin = read_administrator(&env);
        verify_auth(&env, &admin);
        assert_eq!(has_owner(&env, token_id),false);

        write_balance(&env, to.clone(), WriteType::Add);
        write_owner(&env, token_id, to.clone());
        increment_supply(&env);
        event::mint(&env, admin, to, token_id)
    }


    fn burn(env: Env, token_id: i128){
        let admin = read_administrator(&env);
        verify_auth(&env, &admin);

        let from = read_owner(&env, token_id);
        remove_owner(&env, token_id);
        remove_approval(&env, token_id);
        write_balance(&env, from.clone(), WriteType::Remove);

        event::burn(&env, from, token_id);
    }


}


