use soroban_sdk::{Address, Env};

use crate::storage_types::DataKey;

pub fn has_gate_way(e: &Env) -> bool {
    let key = DataKey::GateWay;
    e.storage().instance().has(&key)
}

pub fn read_gate_way(e: &Env) -> Address {
    let key = DataKey::GateWay;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_gate_way(e: &Env, id: &Address) {
    let key = DataKey::GateWay;
    e.storage().instance().set(&key, id);
}
