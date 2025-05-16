/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Env, Symbol, Vec, Address, U256, contracttype, Bytes,
                  crypto::Crypto, token, String, bytes,BytesN};

use soroban_sdk::xdr::{ToXdr,FromXdr };
use crate::admin::{has_administrator, read_administrator, write_administrator};
use crate::order_count::{ read_order_count, add_order, delete_order};


use crate::gate_way::{read_gate_way,write_gate_way};
use crate::orderKey::{write_order_key, remove_order_key, has_order_key, read_order_key};
use crate::peer_chain::{read_peer_data, write_peer_data};
use crate::storage_types::{MessageData, PeerChainData};
use  nft_interface::NftContractClient;
use message_bridge_interface::MessageContractClient;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrderKeyData {
    pub nftContract:Address,
    pub nftId: i128,
    pub priceToken: Bytes,
    pub price: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
struct FunctionCallData {
    messageFunc:Symbol,
    messageData:Bytes,
}


#[contract]
pub struct NftMarketContract;

#[contractimpl]
impl NftMarketContract {
    pub fn initialize(env:Env, admin:Address, gate_way:Address, evm_chain:Bytes, evm_chain_id: U256) {
        if has_administrator(&env) {
            panic!("already initialized")
        }
        admin.require_auth();
        write_administrator(&env, &admin);
        write_gate_way(&env, &gate_way);
        write_peer_data(&env, PeerChainData {evm_chain_id:evm_chain_id.clone(), evm_chain_sc: evm_chain.clone()});
        env.events().publish(("initialize",), (admin, gate_way, evm_chain, evm_chain_id));
    }
    pub fn update_peer_data(env: Env, admin:Address ,  evm_chain:Bytes, evm_chain_id: U256) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        write_peer_data(&env, PeerChainData {evm_chain_id:evm_chain_id.clone(), evm_chain_sc: evm_chain.clone()});
        env.events().publish(("update_peer_data",), (evm_chain_id, evm_chain));
    }
    pub fn peer_data(env: Env) -> PeerChainData {
        read_peer_data(&env)
    }
    pub fn gate_way(env: Env)-> Address {
        read_gate_way(&env)
    }
    pub fn update_gate_way(env: Env, admin:Address, gate_way:Address) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();
        write_gate_way(&env, &gate_way);
        env.events().publish(("update_gate_way",),gate_way)
    }

    pub fn admin(env: Env) -> Address {
        let old_admin:Address  = read_administrator(&env);
        return old_admin;
    }
    pub fn change_admin(env: Env, admin: Address, new_admin:Address) {
        let old_admin:Address  = read_administrator(&env);
        assert!(admin.eq(&old_admin), "admin is not old_admin");
        admin.require_auth();

        write_administrator(&env, &new_admin);
        env.events().publish(("change_admin",),new_admin)
    }
    pub fn order_count(env: Env) -> u128{
        let mut count = read_order_count(&env);
        count

    }
    pub fn cancel_order(env: Env,   // todo   orderKey
                        sender:Address,
                        _order_key:Bytes,

    ) {

        sender.require_auth();

        let order_key:BytesN<32> = BytesN::try_from(_order_key).unwrap();

        assert_eq!(has_order_key(&env, order_key.clone()), true);

        let (old_message_data,owner) = read_order_key(&env, order_key.clone());

        assert_eq!(sender, owner);

        let CREATEORDER = String::from_str(&env, "CreateOrder");

        if old_message_data.messageType != CREATEORDER {
            panic!("message type should be create order");
        }


        let mut message_data = old_message_data.clone();
        message_data.messageType = String::from_str(&env,"CancelOrder");


        write_order_key(&env, order_key.clone(), message_data.clone(),sender);

        env.events().publish(("CancelOrder",), (order_key.clone(),message_data.clone()));


        let peer_chain_data = read_peer_data(&env);

        let data = message_data.to_xdr(&env);

        Self::out_bound_call(env, peer_chain_data.evm_chain_id, peer_chain_data.evm_chain_sc, data);
    }

    pub fn create_order(env: Env, sender:Address,
                        message_type: String,
                        nft_contract:Address,
                         nft_id: i128,
                         price_token: Bytes,
                         price: i128,
                        recipient: Bytes,  //evm address
                         buyer:Address,    // stellar address    // can be enmpty,不用存储
                        ) {

        if message_type != String::from_str(&env, "CreateOrder") {
            panic!("message type is not CreateOrder");
        }
        // 转账

        sender.require_auth();
        let nft_client = NftContractClient::new(&env, &nft_contract.clone());

        let me_address = env.current_contract_address();

        nft_client.transfer(&sender, &me_address ,&nft_id);

        let orderKeydata = OrderKeyData {
            nftContract: nft_contract.clone(),
            nftId: nft_id.clone(),
            priceToken: price_token.clone(),
            price: price.clone(),
        };



        let bts = orderKeydata.to_xdr(&env);

        let order_key_hash = env.crypto().keccak256(&bts);  // to do: use  /*
        let order_key = order_key_hash.to_bytes();

        let message_data = MessageData {
            messageType: message_type.clone(),
            nftContract: nft_contract.clone(),
            nftId: nft_id.clone(),
            priceToken: price_token.clone(),
            price: price.clone(),
            recipient: recipient.clone(),
            buyer: buyer.clone(),

        };

        write_order_key(&env, order_key.clone(), message_data.clone(), sender);
        add_order(&env, order_key.clone());
        env.events().publish(("CreateOrder",), (order_key.clone(),message_data.clone())); // todo 统一事件
        let peer_chain_data = read_peer_data(&env);

        let data = message_data.to_xdr(&env);


        Self::out_bound_call(env, peer_chain_data.evm_chain_id, peer_chain_data.evm_chain_sc, data);
    }


    pub fn wmbReceive( env: Env, data: Bytes) {

        let gateway = read_gate_way(&env);
        gateway.require_auth();

        let message_data = MessageData::from_xdr(&env, &data).unwrap();
        let message_type_str= message_data.messageType.clone();

        let ret_message_order_success = String::from_str(&env, "OrderSuccess");
        let ret_message_unlock_nft = String::from_str(&env, "UnlockNFT");
        let ret_message_cancel_order = String::from_str(&env, "CancelSuccess");

        if message_type_str == ret_message_order_success {
            Self::receive_message_order_success(env, message_data);
        }else if message_type_str == ret_message_unlock_nft {
            Self::receive_message_unlock_nft(env, message_data);
        }else if message_type_str == ret_message_cancel_order {
            Self::receive_message_cancel_order(env, message_data);
        }else {
            panic!("error message_type");
        }
    }

     fn receive_message_order_success(env: Env, message_data: MessageData) {
         let orderKeydata = OrderKeyData {
             nftContract: message_data.nftContract.clone(),
             nftId: message_data.nftId.clone(),
             priceToken: message_data.priceToken.clone(),
             price: message_data.price.clone(),
         };
         let bts = orderKeydata.to_xdr(&env);

         let order_key_hash = env.crypto().keccak256(&bts);  // to do: use  /*
         let order_key = order_key_hash.to_bytes();

         let (old_message_data,owner) = read_order_key(&env, order_key.clone());

         let status_create_order = String::from_str(&env, "CreateOrder");
         let status_cancel_order = String::from_str(&env, "CancelOrder");

         if old_message_data.messageType == status_create_order {
             remove_order_key(&env, order_key.clone());
             delete_order(&env, order_key.clone());

             env.events().publish(("OrderSuccess",), (order_key.clone(),message_data))
         }else if old_message_data.messageType == status_cancel_order {
             remove_order_key(&env, order_key.clone());
             delete_order(&env, order_key.clone());
             env.events().publish(("CancelFailed",),(order_key.clone(),message_data))
         }
    }
     fn receive_message_unlock_nft(env: Env, message_data: MessageData) {

         let nft_client = NftContractClient::new(&env, &message_data.nftContract.clone());
         let cur_scAddr = env.current_contract_address();
         let buyer = message_data.buyer.clone();
         nft_client.transfer(&cur_scAddr, &buyer, &message_data.nftId.clone());

         env.events().publish(("UnlockNFT",),message_data);

    }

     fn receive_message_cancel_order(env: Env, message_data: MessageData) {
        let orderKeydata = OrderKeyData {
            nftContract: message_data.nftContract.clone(),
            nftId: message_data.nftId.clone(),
            priceToken: message_data.priceToken.clone(),
            price: message_data.price.clone(),
        };
        let bts = orderKeydata.to_xdr(&env);

        let order_key_hash = env.crypto().keccak256(&bts);  // to do: use  /*
        let order_key = order_key_hash.to_bytes();

        let (old_message_data, owner) = read_order_key(&env, order_key.clone());
        let status_cancel_order = String::from_str(&env, "CancelOrder");
        assert_eq!(old_message_data.messageType, status_cancel_order, "old message type is not CancleOrder");


        remove_order_key(&env, order_key.clone());
        delete_order(&env, order_key.clone());
        env.events().publish(("message_cancel_order","remove_order_key"),(order_key.clone(), old_message_data));


        let nft_address = message_data.nftContract.clone();
        let nft_client = NftContractClient::new(&env,&nft_address);
        let my_address = env.current_contract_address();
        let to_address = owner;
        nft_client.transfer(&my_address,&to_address,&message_data.nftId.clone());
        env.events().publish(("CancelSuccess",), (order_key.clone(),message_data))

    }

    pub fn out_bound_call(env: Env, to_chain_id:U256, to: Bytes,data: Bytes ) {
        let gate_way_address = read_gate_way(&env);
        let gateway_client = MessageContractClient::new(&env, &gate_way_address);
        let source_contract_address = env.current_contract_address();

        let function_call = FunctionCallData {
            messageFunc: Symbol::new(&env,"wmbReceive"),
            messageData: data,
        };
        let function_call_data = function_call.to_xdr(&env);

        gateway_client.outbound_call( &to_chain_id,  &to, &function_call_data,&source_contract_address)
        // wmbReceive, messagedata, sourcechainid, sourcescaddr,  -> function_call_data
    }
}
