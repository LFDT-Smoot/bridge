use soroban_sdk::{Address, Bytes, BytesN, Env, U256};

use crate::storage_types::{DataKey, NonceDataKey};

/// Build the deterministic storage key for a (src_chain, dst_chain, src_sc, dst_sc) path.
fn nonce_key(
    source_chain_id: U256,
    dst_chain_id: U256,
    source_contract: Address,
    target_contract: Bytes,
) -> DataKey {
    DataKey::NONCE(NonceDataKey {
        source_chain_id,
        dst_chain_id,
        source_contract,
        target_contract,
    })
}

/// Check whether a nonce entry exists for a cross-chain path.
pub fn has_nonce(
    e: &Env,
    source_chain_id: U256,
    dst_chain_id: U256,
    source_contract: Address,
    target_contract: Bytes,
) -> bool {
    let key = nonce_key(source_chain_id, dst_chain_id, source_contract, target_contract);
    // Persistent storage: each key is a *separate* ledger entry, so the number
    // of nonce paths does not count against the single instance-storage size cap.
    e.storage().persistent().has(&key)
}

/// Read the current outbound nonce for a cross-chain path.
/// Returns 0 when no message has ever been sent on this path.
pub fn read_nonce(
    e: &Env,
    source_chain_id: U256,
    dst_chain_id: U256,
    source_contract: Address,
    target_contract: Bytes,
) -> u128 {
    let key = nonce_key(source_chain_id, dst_chain_id, source_contract, target_contract);
    match e.storage().persistent().get::<DataKey, u128>(&key) {
        Some(nonce) => nonce,
        None => 0,
    }
}

/// Persist the outbound nonce for a cross-chain path.
///
/// # Storage choice
/// Uses **persistent** storage instead of instance storage. Instance storage
/// serializes *all* keys into one ledger entry and hits a hard per-entry size
/// cap. Attackers could otherwise exhaust that cap by invoking `outbound_call`
/// with many different (dst_chain, target_contract, source_contract) tuples,
/// which would permanently DoS the bridge (no more nonces, replay marks, or
/// admin updates could be written).
pub fn write_nonce(
    e: &Env,
    source_chain_id: U256,
    dst_chain_id: U256,
    source_contract: Address,
    target_contract: Bytes,
    nonce: u128,
) {
    let key = nonce_key(source_chain_id, dst_chain_id, source_contract, target_contract);
    e.storage().persistent().set(&key, &nonce);
}