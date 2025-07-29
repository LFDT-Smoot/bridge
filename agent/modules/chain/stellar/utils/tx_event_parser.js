/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const StellarXdr = require("./StellarXdr_DynamicImport");


// Get value from event's data node:
const getValue = (valueObj) =>  Object.values(valueObj)[0];

function isArray(value) {
  return Array.isArray(value);
}

function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  let proto = Object.getPrototypeOf(value);
  if (proto === null) {
    // Objects created with Object.create(null) have no prototype
    return true;
  }
  let Ctor = proto.constructor;
  return typeof Ctor === 'function' && Ctor === Object;
}

async function get_all_events(result_meta_xdr_base64) {

  await StellarXdr.initialize();

  const xdrJsonStr = StellarXdr.decode("TransactionMeta", result_meta_xdr_base64);
  const event_info_list = get_nodes_of_events(xdrJsonStr);

  let process_finalEventNode = function (finalEventNode) {
    const contractId = finalEventNode.contract_id;
    const node_of_eventBody = finalEventNode.body;
    const topics = node_of_eventBody.v0.topics;
    let data = node_of_eventBody.v0.data;
    data = data.vec ? data.vec : data;
    return {contractId, topics, data};
  }

  let events = event_info_list.filter(e => e["type_"] === "contract").map( evtInfo => process_finalEventNode(evtInfo));
  return events;
}

function get_nodes_of_events(xdrJsonStr) {
  const xdrJson = JSON.parse(xdrJsonStr);
  let allEventNodes = [];

  if(xdrJson.v4) {
    allEventNodes = xdrJson.v4.operations
      .filter(operation => operation.events && operation.events.length > 0)
      .flatMap(operation => operation.events);
  } else if(xdrJson.v3) {
    allEventNodes = xdrJson.v3.soroban_meta.events;
  }else {
    throw new Error("Invalid or unknown transaction");
  }
  return allEventNodes;
}


/**
 *
 * @param events  instance of {contractId, topics, data} structure, for example, the return by above 'get_all_events' method.
 * @param expected_contractId   which contract emitted this event
 * @param expected_topics  array of topic elements to match.
 */
function get_events_data_by(events, expected_contractId, expected_topics) {
  let result = [];
  events.map(e => {
    if(e.contractId === expected_contractId) {
      const expectedTopicNum = expected_topics.length;
      const actualTopics = e.topics;

      let bTopicMatched = false;
      let matchedEventName = "";
      for(let i = 0; i < expectedTopicNum; i++) {
        let firstActualTopic = getValue(actualTopics[0]); // TODO: maybe need to check second/third/... topic
        if(expected_topics.includes(firstActualTopic)) {
          bTopicMatched = true;
          matchedEventName = firstActualTopic;
          break;
        }
      }

      if(!bTopicMatched) return;

      const [taskIdObj, networkIdObj, contractAddressObj, finalFuncCallDataObj] = e.data;

      const taskIdHexArrayStr = getValue(taskIdObj);
      const networkIdBigNum = getValue(networkIdObj);   // of peer chain
      const contractAddressHexArrayStr  = getValue(contractAddressObj);  // of peer chain
      const finalFuncCallDataHexArrayStr = getValue(finalFuncCallDataObj);

      // const taskId = Buffer.from(JSON.parse(taskIdHexArrayStr)).toString("hex");
      // const networkId = networkIdBigNum;
      // const contractAddress = Buffer.from(JSON.parse(contractAddressHexArrayStr)).toString("hex");

      result.push({
        event: matchedEventName, // event name, such as 'OutboundTaskExecuted', 'CrosschainFunctionCall'
        args:{
          "taskId" : taskIdHexArrayStr,
          "networkId": networkIdBigNum,  // of peer chain
          "contractAddress": contractAddressHexArrayStr, // on peer chain
          "functionCallData": finalFuncCallDataHexArrayStr,
        },
      })
    }
  })
  return result;
}

exports.eventParser = get_all_events;
exports.get_events_data_by = get_events_data_by;


