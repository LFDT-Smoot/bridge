/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

const WmbGate_AbstractConvert = require("@modules/chain/gateway_convert_abstract.js");

const {
  hexAdd0x,
  hexTrip0x
} = require('@framework/comm/lib.js');

const Web3 = require("web3");
const web3 = new Web3();
const ethers = require('ethers');
const ethUtil = require('ethereumjs-util');

module.exports = class EvmBaseConverter extends WmbGate_AbstractConvert{
  constructor(chainType = null, log = console) {
    super(chainType, log);
  }

  encodePacked(typesArray, signData) {
    this.logger.debug("********************************** encode signData **********************************", signData);

    return hexAdd0x(ethers.solidityPacked(typesArray, signData));
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

  getEncodeInfo(taskId, networkId, contractAddr, finalFunctionCallData) {
    let signData = [];
    let typesArray = [];
    signData = [taskId, networkId, contractAddr, finalFunctionCallData];
    console.log("getEncodeInfo() signData: ", JSON.stringify(signData));
    typesArray = ['bytes32', 'uint256', 'address', 'bytes'];

    let encodedInfo = this.encodeTuple(typesArray, signData);
    return encodedInfo;
  }

  getEncodeProof(signatures) {
    let encodedProof;
    let typ = '0';
    let proofData = '0x0000';
    let encodedProofData = [typ, proofData, signatures];
    let encodedProofTypesArray = ['uint256', 'bytes', 'tuple(uint256 by, uint256 sigR, uint256 sigS, uint256 sigV, bytes32 meta)[]'];

    encodedProof = hexAdd0x(web3.eth.abi.encodeParameters(encodedProofTypesArray, encodedProofData));
    return encodedProof;
  }


  //==================== utils: =====================

  encodeTuple(typesArray, signData) {
    const tupleType = this.convertToTupleType(typesArray);
    this.logger.debug("********************************** encodeTuple signData **********************************", tupleType, signData, "hashX:", this.hashX);

    return hexAdd0x(web3.eth.abi.encodeParameter(tupleType, signData));
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