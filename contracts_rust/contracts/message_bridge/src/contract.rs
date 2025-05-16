/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#![no_std]
use soroban_sdk::{auth::{Context, CustomAccountInterface}, crypto::Crypto,
                  contract, contracterror, contractimpl, contracttype,
                  symbol_short, Address, BytesN, Env, Map, String,
                  Symbol, TryIntoVal,vec,Error,Val,
                  Vec, Bytes, U256, IntoVal, assert_with_error};
use soroban_sdk::crypto::Hash;
use soroban_sdk::xdr::{FromXdr, PublicKey, ToXdr};

use soroban_sdk::xdr::TypeVariant::Uint256;
use crate::admin::{has_administrator, read_administrator, write_administrator};
use crate::chain_id::{has_network_id,read_network_id,write_network_id};
use crate::nonce::{write_nonce,has_nonce,read_nonce};
use crate::verifier::{read_verifier, write_verifier};
use crate::MessageExecuted::{has_task_key,write_task_key};

use crate::ICrosschainVerifier::VerifierClient;
use crate::cross_chain_verifier::{ decode_and_verify, Secep256k1Signature};
use crate::threshold::{has_threshold, write_threshold,read_threshold};
use crate::Secp256k1Pubkey::{has_pubkey_count, has_pubkey_no, add_pubkey, list_pubkey, find_pubkey, delete_pubkey, read_pubkey_count};
use crate::peer_chain::{read_peer_data,write_peer_data};
use crate::storage_types::{ PeerChainData};


#[contract]
pub struct MessageContract;


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
struct FunctionCallData {
    messageFunc:Symbol,
    messageData:Bytes,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
struct OutBoundFunctionCallData {
    functionCallData: Bytes,
    networkId: U256,
    contractAddress: Address
}


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncodeInfo {
    pub taskId: Bytes,
    pub networkId: U256,
    pub contractAddress: Address,
    pub functionCallData: Bytes
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InBoundFunctionCallData {
    functionCallData: Bytes,
    networkId: U256,
    contractAddress: Bytes
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaskIdData {
    source_network_id:U256,
    source_contract_address:Address,
    target_network_id:U256,
    target_contract_address: Bytes,
    finally_function_call_data: OutBoundFunctionCallData,
    nonce:u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SignatureVale {
    signature: Bytes,
    recid: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncodeProofData {
    signatures:Vec<SignatureVale>
}



#[contractimpl]
impl MessageContract {
    pub fn init(env:Env, admin: Address, network_id: U256, owner:Vec<BytesN<65>>, threshold:u128, evm_chain:Bytes, evm_chain_id: U256){
        assert!(!has_administrator(&env), "already initialized");
        admin.require_auth();
        write_administrator(&env, &admin);
        write_network_id(&env, &network_id);
        write_threshold(&env, threshold);
        for i in 0..owner.len() {
            add_pubkey(&env, owner.get_unchecked(i));
        }
        write_peer_data(&env, PeerChainData {evm_chain_id:evm_chain_id.clone(), evm_chain_sc: evm_chain.clone()});
        env.events().publish(("init",),(admin, network_id, owner, threshold));

    }

    pub fn change_peer_data(env: Env, admin:Address ,  evm_chain:Bytes, evm_chain_id: U256) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        write_peer_data(&env, PeerChainData {evm_chain_id:evm_chain_id.clone(), evm_chain_sc: evm_chain.clone()});
        env.events().publish(("update_peer_data",), (evm_chain_id, evm_chain));
    }
    pub fn peer_data(env: Env) -> PeerChainData {
        read_peer_data(&env)
    }
    pub fn get_network_id(env: Env)-> U256 {
        read_network_id(&env)
    }
    pub fn update_network_id(env: Env, admin: Address, network_id: U256) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        write_network_id(&env, &network_id);
        env.events().publish(("update_network_id",),network_id);
    }

    pub fn admin(env: Env) -> Address {
        let old_admin:Address  = read_administrator(&env);
        return old_admin;
    }

    pub fn update_admin(env: Env, admin: Address, new_admin:Address) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();

        write_administrator(&env, &new_admin);
        env.events().publish(("update_admin", ), new_admin)

    }

    pub fn add_owner(env:Env, admin:Address , owner:Bytes) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();

        let pubkey:BytesN<65> = BytesN::try_from(owner.clone()).unwrap();
        add_pubkey(&env, pubkey);
        env.events().publish(("add_owner",),owner);
    }
    pub fn remove_owner(env: Env, admin: Address , owner:Bytes) {
        let old_admin = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        let pubkey:BytesN<65> = BytesN::try_from(owner.clone()).unwrap();
        delete_pubkey(&env,pubkey);
        env.events().publish(("remove_owner",),owner);
    }

    pub fn list_owner(env: Env) -> Vec<BytesN<65>> {
        list_pubkey(&env)
    }
    pub fn owner_count(env:Env) -> u128{
        read_pubkey_count(&env)
    }
    pub fn get_threshold(env: Env) -> u128 {
        read_threshold(&env)
    }
    pub fn set_threshold(env: Env,admin: Address, threshold:u128 ){
        let old_admin = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        write_threshold(&env, threshold);
        env.events().publish(("set_threshold",),threshold);
    }



    // wmbReceive, messagedata, sourcechainid, sourcescaddr,  -> function_call_data
    pub fn outbound_call(env: Env, network_id: U256,
                         contract_address: Bytes,
                         functionCallData: Bytes,// todo modifiy functioncalldata toxdr,
                         source_contract_address: Address,
    ) {
        source_contract_address.require_auth();
        let chain_id = read_network_id(&env);
        let finally_function_call_data = OutBoundFunctionCallData {
            functionCallData,
            networkId:chain_id.clone(),
            contractAddress:source_contract_address.clone()
        };

        let mut nonce = read_nonce(&env,chain_id.clone(), network_id.clone(), source_contract_address.clone(), contract_address.clone());
        nonce += 1;

        let task_id_data = TaskIdData {
            source_network_id: chain_id.clone(),
            source_contract_address:source_contract_address.clone(),
            target_network_id:network_id.clone(),
            target_contract_address: contract_address.clone(),
            finally_function_call_data:finally_function_call_data.clone(),
            nonce:nonce.clone()
        };

        let data = task_id_data.to_xdr(&env);
        let task_id = env.crypto().keccak256(&data).to_bytes();
        write_nonce(&env, chain_id.clone(), network_id.clone(), source_contract_address, contract_address.clone(), nonce);
        env.events().publish(("CrosschainFunctionCall", ), (task_id.clone(), network_id.clone(), contract_address.clone(),finally_function_call_data.clone().to_xdr(&env)));
        env.events().publish(("OutboundTaskExecuted",), ( task_id.clone(), network_id, contract_address,finally_function_call_data.to_xdr(&env)))
    }
    pub fn inbound_call(env: Env,
                          network_id: U256,  //stellar chainid
                          encoded_info: Bytes,
                          encoded_proof: Bytes,

    ){

        let encode_proof_data = EncodeProofData::from_xdr(&env,&encoded_proof).unwrap();

        let n = encode_proof_data.signatures.len();

        let mut signatures:Vec<Secep256k1Signature> = vec![&env,];
        for i in 0..n {
            let signatuers_data = encode_proof_data.signatures.get_unchecked(i);

            let signature = signatuers_data.signature;
            let recid = signatuers_data.recid;

            let proof:BytesN<64> = BytesN::try_from(signature).unwrap();
            let encoded_recid = recid as u32;

            signatures.push_back(Secep256k1Signature {
                signature: proof,
                recid:encoded_recid
            });
        }

        let verified_encode_info = decode_and_verify(&env,encoded_info, &signatures);

        let encode_info = EncodeInfo::from_xdr(&env, &verified_encode_info).unwrap();

        let task_id = encode_info.taskId.clone();
        let receipt_network_id = encode_info.networkId.clone();
        let call_contract_addr = encode_info.contractAddress.clone();
        let encode_funcation_call_data = encode_info.functionCallData.clone();

        env.events().publish(("InboundTaskExecuted",), (task_id.clone(), receipt_network_id.clone(), call_contract_addr.clone(), encode_funcation_call_data.clone()));

        if has_task_key(&env, task_id.clone()) == true {
            panic!("WmbGateway: Message already executed")
        }

        let local_network_id = read_network_id(&env);

        if network_id != local_network_id {
            panic!("call input  network is invalide");
        }
        if receipt_network_id != local_network_id {
            panic!("WmbGateway, Invalide NetworkId ")
        }

        write_task_key(&env, task_id.clone());



        let inbound_function_call_data = InBoundFunctionCallData::from_xdr(&env, &encode_funcation_call_data).unwrap();


        let source_contract = inbound_function_call_data.contractAddress.clone();
        let source_chain_id = inbound_function_call_data.networkId.clone();

        let peerChain = read_peer_data(&env);

        if(peerChain.evm_chain_sc != source_contract || peerChain.evm_chain_id != source_chain_id) {

            panic!("source_contract and source_chain_id is invalidate");
        }



        let functaionCallData = FunctionCallData::from_xdr(&env, &inbound_function_call_data.functionCallData).unwrap();
        let receipt_msg = functaionCallData.messageFunc;
        let message_data = functaionCallData.messageData;

        let res: Val = env.invoke_contract(&call_contract_addr, &receipt_msg, vec![&env, message_data.to_val()]);
        env.events().publish(("inbound_call", "invoke_contract", call_contract_addr.clone()), res);



    }

}


