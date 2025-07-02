/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const WmbAppConvertAbstract = require("@framework/converter/wmbapp_convert_abstract.js");

const {
  hexAdd0x,
  hexTrip0x
} = require('@framework/comm/lib.js');

const Web3 = require("web3");
const web3 = new Web3();
const ethers = require('ethers');
const ethUtil = require('ethereumjs-util');

const g_ABI = require('./abi.NftMarket.json');

let Contract = require("@framework/comm/contract/Contract.js");

const messageDataABI = [
  {
    "name": "messageType",
    "type": "string"
  },
  {
    "name": "nftContract",
    "type": "bytes"
  },
  {
    "name": "nftId",
    "type": "uint256"
  },
  {
    "name": "priceToken",
    "type": "address"
  },
  {
    "name": "price",
    "type": "uint256"
  },
  {
    "name": "recipient",
    "type": "address"
  },
  {
    "name": "buyer",
    "type": "bytes"
  }
];

module.exports = class NftMarketAppConverter extends WmbAppConvertAbstract{
  constructor(chainType = null, log = console) {
    super(chainType, log);
    this.setConvertContract();
  }

  //  =================== interface implementation:
  encodeFunctionCallData(messageData) {
    return this.encodeTupleFunctionCallData(messageData);
  }

  decodeFunctionCallData(functionCallData) {
    return this.convertTupleFunctionCallData(functionCallData);
  }


  // =================== utils: ====================

  encodeTupleFunctionCallData(messageData) {
    let encodeMessage = this.encodeMessageData(messageData);
    let encodeFunctionData = this.encodeContractData(encodeMessage);
    return encodeFunctionData;
  }

  convertTupleFunctionCallData(functionCallData) {
    let decodeFunctionData = this.decodeContractData(functionCallData);
    let messageData = decodeFunctionData.params.data;
    let {messageType, nftContract, nftId, priceToken, price, recipient, buyer} = this.decodeMessageData(messageData);
    return Object.assign({}, decodeFunctionData, {messageData: {messageType, nftContract, nftId, priceToken, price, recipient, buyer}});
  }

  encodeMessageData(messageData) {
    return this.encodeTuple(messageDataABI, messageData);
  }

  decodeMessageData(messageData) {
    return this.decodeTuple(messageDataABI, messageData);
  }

  processValueByType(tupleType, data) {
    if (Array.isArray(data)) {
      return data;
    }
    return tupleType.components.reduce((acc, component) => {
      let value = data[component.name] || data[component.name.toLowerCase()];

      if (value === undefined) {
        throw new Error(`Missing data for component: ${component.name}`);
      }

      switch (component.type) {
        case 'bytes':
          acc[component.name] = web3.utils.isHexStrict(value) ? value : web3.utils.asciiToHex(value);
          break;
        case 'address':
          acc[component.name] = hexAdd0x(value).toLowerCase();
          break;
        case 'uint256':
        case 'int256':
            acc[component.name] = value.toString();
            break;
        default:
          acc[component.name] = value;
      }
      return acc;
    }, {});
  }

  convertToTupleType(input) {
    const isObjectArray = Array.isArray(input) && typeof input[0] === 'object';

    const components = input.map((item, index) => {
      if (isObjectArray) {
        return {
          type: item.type,
          name: item.name
        };
      } else {
        return {
          type: item
        };
      }
    });

    return {
      type: 'tuple',
      components: components
    };
  }

  encodeTuple(typesArray, signData) {
    const tupleType = this.convertToTupleType(typesArray);
    const orderedData = this.processValueByType(tupleType, signData);
    this.logger.debug("********************************** encodeTuple signData **********************************", tupleType, orderedData, "hashX:", this.hashX);

    return hexAdd0x(web3.eth.abi.encodeParameter(tupleType, orderedData));
  }

  decodeTuple(typesArray, signData) {
    const tupleType = this.convertToTupleType(typesArray);
    this.logger.debug("********************************** decode signData **********************************", tupleType, signData, "hashX:", this.hashX);

    return web3.eth.abi.decodeParameter(tupleType, signData);
  }

  encodeContractData(...encodeMessage) {
    let operationContract = new Contract(g_ABI);
    let encodeFunctionData = operationContract.constructData(this.func, ...encodeMessage);
    return encodeFunctionData;
  }

  decodeContractData(functionCallData) {
    let operationContract = new Contract(g_ABI);
    let decodeFunctionData = operationContract.decodeData(functionCallData);
    this.logger.debug('decodeContractData result is', decodeFunctionData);
    return decodeFunctionData;
  }

  isValidEVMAddress(address) {
    try {
      let validate;
      if (/^0x[0-9a-f]{40}$/.test(address.toLowerCase())) {
        validate = true;
      } else {
        validate = false;
      }
      return validate;
    } catch (err) {
      this.logger.error("isValidEVMAddress Error:", err);
      return false;
    }
  }

  convertToEthAddress(addr) {
    if (this.isValidEVMAddress(addr)) {
      return addr.toLowerCase();
    }

    const keccak256Hash = ethUtil.keccak256(addr);
    const addressBuffer = keccak256Hash.slice(-20);
    const ethAddress = '0x' + addressBuffer.toString('hex');

    return ethAddress;
  }

}