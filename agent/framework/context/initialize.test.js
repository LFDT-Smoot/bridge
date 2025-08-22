require('module-alias/register');

/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

// Mock dependencies to isolate the configuration import test
jest.mock('./index.js', () => ({
  setPrivateKey: jest.fn(),
  setAgentClass: jest.fn(),
  setChainClass: jest.fn(),
  setRelayClass: jest.fn()
}));

jest.mock('../utils/keyStore', () => ({
  getPrivateKey: jest.fn(() => 'mock-private-key')
}));

jest.mock('@modules/chain/evm/ethBase.js', () => jest.fn());
jest.mock('@modules/chain/stellar/stellar.js', () => jest.fn());
jest.mock('@modules/relay/multiSig', () => jest.fn());
jest.mock('@modules/chain/evm/EthAgentModel.js', () => jest.fn());
jest.mock('@modules/chain/stellar/StellarAgent.js', () => jest.fn());
jest.mock('@modules/chain/evm/convert/index.js', () => jest.fn());
jest.mock('@modules/chain/stellar/convert/index.js', () => jest.fn());
jest.mock('@modules/converter/nftMarket/stellar/index.js', () => jest.fn());
jest.mock('@modules/converter/nftMarket/evm/index.js', () => jest.fn());
jest.mock('./WmbConverterManager.js', () => {
  return jest.fn().mockImplementation(() => ({
    setWmbGateConverter: jest.fn(),
    setWmbAppConverter: jest.fn(),
    getWmbAppConverterByScAddress: jest.fn(() => 'mock-converter')
  }));
});

// Mock global variables
global.agentAddr = 'mock-agent-addr';
global.secret = { 'WORKING_PWD': 'mock-password' };
global.wmbConverterMgr = null;

describe('Initialize Module Integration', () => {
  let WmbConverterManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the module cache to ensure fresh imports
    jest.resetModules();
    WmbConverterManager = require('./WmbConverterManager.js');
  });

  test('should successfully import WmbAppLookupTable from config file', () => {
    // This will execute the initialize.js file and test the import
    expect(() => {
      require('./initialize.js');
    }).not.toThrow();
  });

  test('should create WmbConverterManager with imported configuration', () => {
    require('./initialize.js');
    
    // Verify that WmbConverterManager was called with the configuration
    expect(WmbConverterManager).toHaveBeenCalledTimes(1);
    
    const configArg = WmbConverterManager.mock.calls[0][0];
    expect(configArg).toBeDefined();
    expect(configArg.MATIC).toBeDefined();
    expect(configArg.XLM).toBeDefined();
    expect(configArg.MATIC.NftMarket).toBeDefined();
    expect(configArg.XLM.NftMarket).toBeDefined();
  });

  test('should set global wmbConverterMgr', () => {
    require('./initialize.js');
    
    expect(global.wmbConverterMgr).toBeDefined();
    expect(global.wmbConverterMgr).not.toBeNull();
  });

  test('should verify configuration structure matches expected format', () => {
    require('./initialize.js');
    
    const configArg = WmbConverterManager.mock.calls[0][0];
    
    // Verify the structure matches what was previously inline
    expect(configArg).toEqual({
      "MATIC": {
        "NftMarket": [
          "CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
          "0x4344344a474c4d32434c56493642364c51345a575932585350474336535535504a485658414855544c324d524834475445324a585533364f",
          "0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2"
        ]
      },
      "XLM": {
        "NftMarket": [
          "CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
          "0x4344344a474c4d32434c56493642364c51345a575932585350474336535535504a485658414855544c324d524834475445324a585533364f",
          "0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2"
        ]
      }
    });
  });
});