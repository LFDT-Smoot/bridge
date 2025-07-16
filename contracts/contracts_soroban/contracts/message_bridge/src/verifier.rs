use soroban_sdk::{Address, Env};

use crate::storage_types::DataKey;

pub fn has_verifier(e: &Env) -> bool {
    let key = DataKey::VERIFIER;
    e.storage().instance().has(&key)
}

pub fn read_verifier(e: &Env) -> Address {
    let key = DataKey::VERIFIER;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_verifier(e: &Env, id: &Address) {
    let key = DataKey::VERIFIER;
    e.storage().instance().set(&key, id);
}
