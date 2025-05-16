# Copyright (c) 2019 Wanchain. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
default: build

all: test

test: build
	cargo test

build:
	soroban contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm

fmt:
	cargo fmt --all

clean:
	cargo clean
