/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

let convertDict = require('./index').convertDict;

function matic_convert_test() {
  let chainType = 'MATIC';
  let convert = convertDict[chainType];

  let messageData = [
    "CreateOrder",
    "0x0a8299deccd420d5b6970d611afb25cc8e910220",
    1,
    "0x0a8299deccd420d5b6970d611afb25cc8e910221",
    2,
    "0x0a8299deccd420d5b6970d611afb25cc8e910222",
    "0x0a8299deccd420d5b6970d611afb25cc8e910223"
  ]

  const Web3 = require("web3");
  const web3 = new Web3();

  messageData = [
    "CreateOrder",
    web3.utils.asciiToHex("CDOD6TMKZC7F7YNP23M3KNAD4V6H47TFNMKR7OO3ZBSUVMAKVXCJN6DJ"),
    20001,
    "0x" + "BB4E992daA6a51872C15Bf9db8f072624b91D37B".toLowerCase(),
    123456,
    "0x" + "BB4E992daA6a51872C15Bf9db8f072624b91D37B".toLowerCase(),
    web3.utils.asciiToHex("GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4")
  ]

  messageData = {
    buyer: "GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4",
    messageType: 'CreateOrder',
    nftContract: "CDOD6TMKZC7F7YNP23M3KNAD4V6H47TFNMKR7OO3ZBSUVMAKVXCJN6DJ",
    nftId: 20001,
    price: 123456,
    priceToken: 'BB4E992daA6a51872C15Bf9db8f072624b91D37B',
    recipient: 'BB4E992daA6a51872C15Bf9db8f072624b91D37B'
  }
  let encodeResult = convert.encodeSimpleFunctionCallData(messageData);
  console.log("encodeResult is", encodeResult);

  let functionCallData = encodeResult;
  let convertResult = convert.convertSimpleFunctionCallData(functionCallData);
  console.log("convertResult is", convertResult);

  let encodeResult2 = convert.encodeTupleFunctionCallData(messageData);
  console.log("encodeResult2 is", encodeResult2);

  let functionCallData2 = encodeResult2;
  let convertResult2 = convert.convertTupleFunctionCallData(functionCallData2);
  console.log("convertResult2 is", convertResult2);

  const networkId = 123;
  const contractAddress = '0x0a8299deccd420d5b6970d611afb25cc8e910220';

  let finallyFunctionCallData = convert.encodeFinalFunctionCallData(networkId, contractAddress, functionCallData2);
  console.log("finalFunctionCallData encode result is", finallyFunctionCallData);

  finallyFunctionCallData = '0x3e964acb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000a8299deccd420d5b6970d611afb25cc8e91022100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a8299deccd420d5b6970d611afb25cc8e9102220000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b4372656174654f7264657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140a8299deccd420d5b6970d611afb25cc8e91022300000000000000000000000000000000000000000000000000000000000000000000000000000000800003c6f6eb3cb4b187d3201afbf96a38e62367325b29f9';
  let decodeFinalFunctionCallDataResult = convert.decodeFinalFunctionCallData(finallyFunctionCallData);
  console.log("finalFunctionCallData decode result is", decodeFinalFunctionCallDataResult);

  let stellaAddr = 'CD4M7URGNOKO5V5CDBLSBJKUJUW5XBXEG2E5OQU3C325FSIMJZMM7UFQ';
  let ethAddr = convert.convertToEthAddress(stellaAddr);
  let asciiString = web3.utils.asciiToHex(stellaAddr);
  console.log("addr convert result is", ethAddr);
  console.log("addr asciitoHex convert result is", asciiString);

  let encodeResult3 = convert.encodeTupleFunctionCallData(messageData);
  console.log("encodeResult3 is", encodeResult3);

  let wmbAbi = require('../abi/wmb.stellar.abi.json');
  let wmbFunc = 'outboundCall';
  convert.setConvertContract(wmbAbi, wmbFunc);
  let encodeFuncContractData = convert.encodeContractData(0x80000094, contractAddress, encodeResult3);
  console.log("encodeFuncContractData is", encodeFuncContractData);
}

async function main() {
  try {

    await matic_convert_test();
  } catch (err) {
    console.log("err is", err);
  }
}

main();
