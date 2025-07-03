/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

function hexStrip0x(hexStr) {
  if (0 == hexStr.indexOf('0x')) {
    return hexStr.slice(2);
  }
  return hexStr;
}

class WmbConverterManager {

  constructor(associatedScAddressDict) {
    // For converters keyed by [chainName, dAppName]
    this.appConverterMap = {};
    // For converters keyed only by [chainName]
    this.gateConverterMap = {};

    this.associatedScAddressDict = associatedScAddressDict;
  }

  // --- WmbAppConverter APIs (keyed by chainName and dAppName) ---

  setWmbAppConverter(chainName, dAppName, converter) {
    if (!this.appConverterMap[chainName]) {
      this.appConverterMap[chainName] = {};
    }
    if(this.appConverterMap[chainName][dAppName]){
      throw new Error(`Converter map already set for key: [${chainName},${dAppName}] `);
    }
    this.appConverterMap[chainName][dAppName] = converter;
  }

  getWmbAppConverter(chainName, dAppName) {
    if (this.appConverterMap[chainName] && this.appConverterMap[chainName][dAppName] !== undefined) {
      return this.appConverterMap[chainName][dAppName];
    }
    return null;
  }

  getWmbAppConverterByScAddress(chainName, scAddress) {
    let dAppName = "";

    const dAppAddressMap = this.associatedScAddressDict[chainName];
    if (dAppAddressMap) {
      for (const [name, scAddressArray] of Object.entries(dAppAddressMap)) {

        for (let i = 0; i < scAddressArray.length; i++) {
          const left = hexStrip0x(scAddressArray[i]).toLowerCase();
          const right = hexStrip0x(scAddress).toLowerCase();
          if (left === right) {
            dAppName = name;
            break; // Exit the loop once a match is found
          }
        }

        if (scAddressArray.includes(scAddress)) {
          dAppName = name;
        }
      }
    }

    if(!dAppName) {
      throw new Error(`Could not find for ${chainName} sc address: ${scAddress}`);
    }

    return this.getWmbAppConverter(chainName, dAppName);
  }

  hasWmbAppConverter(chainName, dAppName) {
    return this.appConverterMap[chainName] && this.appConverterMap[chainName][dAppName] !== undefined;
  }

  removeWmbAppConverter(chainName, dAppName) {
    if (this.appConverterMap[chainName] && this.appConverterMap[chainName][dAppName] !== undefined) {
      delete this.appConverterMap[chainName][dAppName];
      if (Object.keys(this.appConverterMap[chainName]).length === 0) {
        delete this.appConverterMap[chainName];
      }
    }
  }

  getAllAppConverterKeys() {
    return Object.keys(this.appConverterMap).reduce((acc, chainName) => {
      acc[chainName] = Object.keys(this.appConverterMap[chainName]);
      return acc;
    }, {});
  }

  // --- WmbGateConverter APIs (keyed by chainName only) ---

  setWmbGateConverter(chainName, converter) {
    if(this.gateConverterMap[chainName]){
      throw new Error(`Gate converter map already set for key: [${chainName}] `);
    }
    this.gateConverterMap[chainName] = converter;
  }

  getWmbGateConverter(chainName) {
    return this.gateConverterMap[chainName] || null;
  }

  hasWmbGateConverter(chainName) {
    return this.gateConverterMap[chainName] !== undefined;
  }

  removeWmbGateConverter(chainName) {
    if (this.gateConverterMap[chainName] !== undefined) {
      delete this.gateConverterMap[chainName];
    }
  }

  getAllGateConverterKeys() {
    return Object.keys(this.gateConverterMap);
  }
}

module.exports = WmbConverterManager;


const bRUnTest = true;
if(bRUnTest) {
  const dict = new WmbConverterManager();

  console.log("--- Testing WmbAppConverter (chainName, dAppName) ---");
  try {
    dict.setWmbAppConverter('row1', 'col1', 'value1');
    dict.setWmbAppConverter('row1', 'col2', 'value2');
    dict.setWmbAppConverter('row2', 'col1', 'value3');
    dict.setWmbAppConverter('row2', 'col1', 'value-3'); // This will throw an error
  } catch (e) {
    console.error(e.message);
  }

  console.log("Get('row1', 'col1'):", dict.getWmbAppConverter('row1', 'col1')); // Output: value1
  console.log("Get('row2', 'col1'):", dict.getWmbAppConverter('row2', 'col1')); // Output: value3
  console.log("Has('row1', 'col2'):", dict.hasWmbAppConverter('row1', 'col2')); // Output: true
  console.log("All App Keys:", dict.getAllAppConverterKeys()); // Output: { row1: [ 'col1', 'col2' ], row2: [ 'col1' ] }

  dict.removeWmbAppConverter('row1', 'col1');
  console.log("Get after remove ('row1', 'col1'):", dict.getWmbAppConverter('row1', 'col1')); // Output: null
  console.log("All App Keys after remove:", dict.getAllAppConverterKeys()); // Output: { row1: [ 'col2' ], row2: [ 'col1' ] }

  console.log("\n--- Testing WmbGateConverter (chainName only) ---");
  try {
    dict.setWmbGateConverter('chain_A', 'gate_converter_A');
    dict.setWmbGateConverter('chain_B', 'gate_converter_B');
    dict.setWmbGateConverter('chain_A', 'gate_converter_A_duplicate'); // This will throw an error
  } catch(e) {
    console.error(e.message);
  }

  console.log("GetGate('chain_A'):", dict.getWmbGateConverter('chain_A')); // Output: gate_converter_A
  console.log("GetGate('chain_C'):", dict.getWmbGateConverter('chain_C')); // Output: null
  console.log("HasGate('chain_B'):", dict.hasWmbGateConverter('chain_B')); // Output: true
  console.log("All Gate Keys:", dict.getAllGateConverterKeys()); // Output: [ 'chain_A', 'chain_B' ]

  dict.removeWmbGateConverter('chain_A');
  console.log("GetGate after remove('chain_A'):", dict.getWmbGateConverter('chain_A')); // Output: null
  console.log("All Gate Keys after remove:", dict.getAllGateConverterKeys()); // Output: [ 'chain_B' ]
}