/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const AbstractConvert = require("./convert_abstract.js");

const {
  hexAdd0x,
  hexTrip0x
} = require('../comm/lib.js');

const Web3 = require("web3");
const web3 = new Web3();
const ethers = require('ethers');
const ethUtil = require('ethereumjs-util');

let Contract = require("../contract/Contract.js");

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

module.exports = class BaseConvert extends AbstractConvert{
  constructor(chainType = null, log = console) {
    super(chainType, log);
    this.setConvertContract();
  }

  getMessageAbi() {
    return messageDataABI;
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


  encodeParameterFromData(tupleType, data) {
    let orderedArray;

    if (Array.isArray(data)) {
      orderedArray = data;
    } else if (typeof data === 'object' && data !== null) {
      const processedData = this.processValueByType(tupleType, data);
      orderedArray = tupleType.components.map(component => processedData[component.name]);
    } else {
      throw new Error('Data must be an array or an object');
    }

    return orderedArray;
  }

  encode(typesArray, signData) {
    this.logger.debug("********************************** encode signData **********************************", signData);
    const tupleType = this.convertToTupleType(typesArray);
    const orderedArray = this.encodeParameterFromData(tupleType, signData);
    this.logger.debug("********************************** encode signData orderedArray **********************************", orderedArray);

    return hexAdd0x(web3.eth.abi.encodeParameters(typesArray, orderedArray));
  }

  encodePacked(typesArray, signData) {
    this.logger.debug("********************************** encode signData **********************************", signData);

    return hexAdd0x(ethers.solidityPacked(typesArray, signData));
  }

  decode(typesArray, signData) {
    this.logger.debug("********************************** decode signData **********************************", signData);

    return web3.eth.abi.decodeParameters(typesArray, signData);
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
    let operationContract = new Contract(this.abi);
    let encodeFunctionData = operationContract.constructData(this.func, ...encodeMessage);
    return encodeFunctionData;
  }

  decodeContractData(functionCallData) {
    let operationContract = new Contract(this.abi);
    let decodeFunctionData = operationContract.decodeData(functionCallData);
    this.logger.debug('decodeContractData result is', decodeFunctionData);
    return decodeFunctionData;
  }

  encodeSimpleFunctionCallData(messageData) {
    let encodeMessage = this.encode(messageDataABI, messageData);
    let encodeFunctionData = this.encodeContractData(encodeMessage);
    return encodeFunctionData;
  }

  convertSimpleFunctionCallData(functionCallData) {
    let decodeFunctionData = this.decodeContractData(functionCallData);
    let messageData = decodeFunctionData.params.data;
    return this.decode(messageDataABI, messageData);
  }

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

  encodeFunctionCallData(messageData) {
    return this.encodeTupleFunctionCallData(messageData);
  }

  decodeFunctionCallData(functionCallData) {
    return this.convertTupleFunctionCallData(functionCallData);
  }

  encodeFinalFunctionCallData(networkId, contractAddress, functionCallData) {
    const parametersData = this.encodePacked(['uint256', 'address'], [networkId, this.convertToEthAddress(contractAddress)]).slice(2);

    const finalFunctionCallData = functionCallData + parametersData;

    return finalFunctionCallData;
  }

  decodeFinalFunctionCallData(finallyFunctionCallData) {
    if (finallyFunctionCallData.length < 104) {
      throw new Error("Invalid input data length");
    }

    const functionCallData = finallyFunctionCallData.slice(0, finallyFunctionCallData.length - 104);

    let networkId = finallyFunctionCallData.slice(finallyFunctionCallData.length - 104, finallyFunctionCallData.length - 40);
    let contractAddress = finallyFunctionCallData.slice(finallyFunctionCallData.length - 40);

    networkId = parseInt(networkId, 16);
    contractAddress = hexAdd0x(contractAddress);

    return {
      functionCallData,
      networkId,
      contractAddress
    };
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