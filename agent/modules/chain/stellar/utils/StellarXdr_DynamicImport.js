/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// (CommonJS with dynamic import for ESM)

const path = require('path');
const fs = require('fs');

let _xdrJsonExports = null;
let init_done = false;

const initialize = async () => {
  if (!init_done) {
    const xdrJsonModule = await import("@stellar/stellar-xdr-json");

    const wasmFilePath = path.join(
      path.dirname(require.resolve('@stellar/stellar-xdr-json')),
      'stellar_xdr_json_bg.wasm' // Assuming this is the name of the WASM file
    );

    console.log("DEBUG: Attempting to initialize with wasmFilePath:", wasmFilePath);

    const wasmBuffer = fs.readFileSync(wasmFilePath);

    await xdrJsonModule.default(wasmBuffer);

    _xdrJsonExports = {
      decode: xdrJsonModule.decode,
      decode_stream: xdrJsonModule.decode_stream,
      encode: xdrJsonModule.encode,
      guess: xdrJsonModule.guess,
      schema: xdrJsonModule.schema,
      types: xdrJsonModule.types,
    };

    init_done = true;
  }
};


// Define functions that *use* the imported module's exports
// These functions can only be called *after* `initialize()` has completed.
const decode = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.decode(...args);
};

const types = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.types(...args);
};

const schema = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.schema(...args);
};

const decode_stream = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.decode_stream(...args);
};

const encode = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.encode(...args);
};

const guess = (...args) => {
  if (!_xdrJsonExports) throw new Error("Stellar XDR JSON not initialized. Call initialize() first.");
  return _xdrJsonExports.guess(...args);
};


// Export statements for CommonJS
module.exports = {
  initialize,
  types,
  schema,
  decode,
  decode_stream,
  encode,
  guess,
};