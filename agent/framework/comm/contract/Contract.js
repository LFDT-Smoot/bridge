/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict";

const Web3 = require("web3");
const web3 = new Web3();

const web3EthAbi = require("web3-eth-abi");

module.exports = class Contract {
  constructor(abi, contractAddr) {
    this.abi = abi;
    if (contractAddr) {
      this.setContractAddr(contractAddr);
    }
    this.setParseAble(true);
    this.setEncodeAble(true);
  }

  setParseAble(able) {
    this.parseable = able;
  }

  setEncodeAble(able) {
    this.encodeable = able;
  }

  setContractAddr(contractAddr) {
    if (/^0x[0-9a-f]{40}$/i.test(contractAddr)) {
      this.contractAddr = contractAddr;
    } else {
      this.contractAddr = null;
    }
  }

  getSolInterface(contractFunc) {
    let contract = new web3.eth.Contract(this.abi, this.contractAddr);
    return contract.methods[contractFunc];
  }

  getEventSignature(eventName) {
    return this.abi.filter((json) => {
      return json.type === 'event' && json.name === eventName;
    }).map((json) => {
      return web3EthAbi.encodeEventSignature(json);
    })
  }

  parseEvents(events) {
    if (events === null || !Array.isArray(events)) {
      return events;
    }
    return events.map((event) => {
      return this.parseEvent(event);
    });
  }

  parseEvent(event) {
    if (event === null || !this.contractAddr || !this.parseable) {
      return event;
    }

    let abiJson = this.abi.find(function (json) {
      return (json.type === 'event' && web3EthAbi.encodeEventSignature(json) === event.topics[0]);
    });
    if (abiJson) {
      try {
        //topics without the topic[0] if its a non-anonymous event, otherwise with topic[0].
        event.topics.splice(0, 1);
        let args = web3EthAbi.decodeLog(abiJson.inputs, event.data, event.topics);
        for (var index = 0; index < abiJson.inputs.length; index++) {
          if (args.hasOwnProperty(index)) {
            delete args[index];
          }
        }
        event.event = event.event || abiJson.name;
        event.args = args;
        delete event.data;
        delete event.topics;
        return event;
      } catch (err) {
        console.log("parseLogs catch err:", err);
      }
    }

  }

  constructData(funcName, ...para) {
    if (!this.encodeable) {
      return {
        method: funcName,
        inputs: para
      }
    }

    let funcInterface = this.getSolInterface(funcName);

    if (funcInterface) {
      return funcInterface(...para).encodeABI();
    } else {
      return null;
    }
  }

  decodeData(encodedData) {
    const methodId = encodedData.slice(0, 10);

    const methodAbi = this.abi.find(abi => 
      abi.type === 'function' && 
      web3.eth.abi.encodeFunctionSignature(abi) === methodId
    );

    if (!methodAbi) {
      throw new Error('Cannot find the function');
    }

    const params = web3.eth.abi.decodeParameters(methodAbi.inputs, '0x' + encodedData.slice(10));

    return {
      method: methodAbi.name,
      params: Object.keys(params).reduce((acc, key) => {
        if (isNaN(parseInt(key))) {
          acc[key] = params[key];
        }
        return acc;
      }, {})
    };
  }
}