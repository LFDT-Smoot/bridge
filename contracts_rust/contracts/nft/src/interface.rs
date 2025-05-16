/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
use soroban_sdk::{Address, Bytes};

pub trait NftContractInterface {
    // --------------------------------------------------------------------------------
    // Authentication interface
    // --------------------------------------------------------------------------------


    // --------------------------------------------------------------------------------
    // Admin interface
    // --------------------------------------------------------------------------------

    /// Returns the current administrator
    fn admin(env: soroban_sdk::Env) -> Address;

    /// If "admin" is the administrator, set the administrator to "new_admin".
    /// Emit event with topics = ["set_admin", admin: Identifier], data = [new_admin: Identifier]
    fn set_admin(
        env: soroban_sdk::Env,
        new_admin: Address,
    );

    // --------------------------------------------------------------------------------
    // Metadata interface
    // --------------------------------------------------------------------------------

    // Get the name for this token.
    fn name(env: soroban_sdk::Env) -> soroban_sdk::Bytes;

    // Get the symbol for this token.
    fn symbol(env: soroban_sdk::Env) -> soroban_sdk::Bytes;

    // Get the uniform resource identifier for token "id".
    fn token_uri(env: soroban_sdk::Env, id: i128) -> soroban_sdk::Bytes;

    // --------------------------------------------------------------------------------
    // Token interface
    // --------------------------------------------------------------------------------

    /// Allows "operator" to manage token "id" if "owner" is the current owner of token "id".
    /// Emit event with topics = ["appr", operator: Identifier], data = [id: i128]
    fn approve(
        env: soroban_sdk::Env,
        from: Address,
        sender: Address,
        token_id: i128,
    );

    /// If "approved", allows "operator" to manage all tokens of "owner"
    /// Emit event with topics = ["appr_all", operator: Identifier], data = [owner: Identifier]
    fn approve_all(
        env: soroban_sdk::Env,
        from: Address,
        sender: Address,
        approved: bool,
    );

    /// Returns the identifier approved for token "id".
    fn get_approve(env: soroban_sdk::Env, id: i128) -> Address;

    /// If "operator" is allowed to manage assets of "owner", return true.
    fn is_approve(
        env: soroban_sdk::Env,
        owner: Address,
        operator: Address,
    ) -> bool;

    /// Get the balance of "id".
    fn balance(env: soroban_sdk::Env, owner: Address) -> i128;

    /// Get the owner of "id" token.
    fn owner(env: soroban_sdk::Env, id: i128) -> Address;

    /// Transfer token "id" from "from" to "to.
    /// Emit event with topics = ["transfer", from: Identifier, to: Identifier], data = [id: i128]
    fn transfer(
        env: soroban_sdk::Env,
        from: Address,
        to: Address,
        token_id: i128,
    );

    /// Transfer token "id" from "from" to "to", consuming the allowance of "spender".
    /// Emit event with topics = ["transfer", from: Identifier, to: Identifier], data = [id: i128]
    fn transfer_from(
        env: soroban_sdk::Env,
        spender: Address,
        from: Address,
        to: Address,
        token_id: i128,
    );

    /// If "admin" is the administrator, mint token "id" to "to".
    /// Emit event with topics = ["mint", to: Identifier], data = [id: i128]
    fn mint(env: soroban_sdk::Env, to: Address, token_id: i128,
    );



    /// If "admin" is the administrator or the token owner, burn token "id" from "from".
    /// Emit event with topics = ["burn", from: Identifier], data = [id: i128]
    fn burn(env: soroban_sdk::Env,token_id: i128);

    // --------------------------------------------------------------------------------
    // Implementation Interface
    // --------------------------------------------------------------------------------

    /// Initialize the contract with "admin" as administrator, "name" as the name, and
    /// "symbol" as the symbol.
    fn initialize(
        e: soroban_sdk::Env,
        admin: Address,
        name: soroban_sdk::Bytes,
        symbol: soroban_sdk::Bytes,
        base_uri:soroban_sdk::Bytes,
    );
}

pub enum WriteType {
    Add,
    Remove,
}

