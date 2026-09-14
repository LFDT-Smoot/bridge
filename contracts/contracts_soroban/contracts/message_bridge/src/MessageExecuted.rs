use soroban_sdk::{Address, Bytes, BytesN, Env, U256};

use crate::storage_types::DataKey;

/// Check whether the given cross-chain task has already been executed
/// (anti-replay guard).
pub fn has_task_key(e: &Env, task_id: Bytes) -> bool {
    let key = DataKey::MessageExecuted(task_id);
    // Persistent storage: every task_id occupies its own ledger entry, so the
    // unbounded set of executed task_ids never grows the single instance-
    // storage ledger entry. Without this migration the instance entry would
    // hit its ~64 KB size cap after ~1,500 inbound messages, permanently
    // DoS-ing every write (admin, nonce, threshold, peer data, new messages).
    e.storage().persistent().has(&key)
}

pub fn read_task_key(e: &Env, task_id: Bytes) -> bool {
    let key = DataKey::MessageExecuted(task_id);
    e.storage().persistent().get(&key).unwrap()
}

/// Mark a cross-chain task as executed (anti-replay).
pub fn write_task_key(e: &Env, task_id: Bytes) {
    let key = DataKey::MessageExecuted(task_id);
    let ret = true;
    e.storage().persistent().set(&key, &ret);
}

pub fn remove_task_key(e: &Env, task_id: Bytes) {
    let key = DataKey::MessageExecuted(task_id);
    e.storage().persistent().remove(&key)
}