/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

use soroban_sdk::{BytesN, U256, Bytes, contractclient, Vec};

pub struct Signagture {
    by : U256,
    sig_r: U256,
    sig_s: U256,
    sig_v: U256,
    meta: BytesN<32>
}

pub struct Proof {
    typ: U256,
    proof_data: Bytes,
    signagtures: Vec<Signagture>,
}
#[contractclient(name = "VerifierClient")]
trait ICrosschainVerifier {
    fn decode_and_verify(network_id: U256, encoded_info: Bytes, encoded_proof: Bytes) -> Bytes;
}