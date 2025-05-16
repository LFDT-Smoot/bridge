/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#![no_std]
use soroban_sdk::{contractclient, Env, Address, U256, Bytes};


#[contractclient(name = "MessageContractClient")]
pub trait MessageContractInterface {
    fn outbound_call(env: Env, network_id: U256,target_contract_address: Bytes, function_calldata: Bytes,source_contract_address: Address );


}
