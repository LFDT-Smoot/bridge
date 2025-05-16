/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  doHttpGet,
  doHttpPost
} = require('../utils/httpRequest')

class ServerAPI {
  constructor(URL_PREFIX) {
    this.url = URL_PREFIX;
  }
  /**
   *
   * @param chainType
   * @return {Promise<T|TResult>}
   *
    ip:port/addTxForSign/:chainType
    POST
    body json
      {
         "uniqueId": "...",
         "dataHash": "...",
         "pk: "...",
         "signature": "...",
         "rawData: "..."
      }

      {
        chainType: ....
        uniqueId: ....,
        dataHash: dataHash,
        rawData: "...",
        timestamp:_.now()
        status: 0,
        signInfo:[
          {
            pk:pk,
            signature: hexSignature,
            timestamp: _.now()
          }
        ]
      }
    return: { status: true } 
          { status: false } 

   */
  addTxForSign(chainType, txObj) {
    return doHttpPost(this.url + '/addTxForSign' + `/${chainType}`, txObj)
  }


  /**
   *
   * @param chainType
   * @return {Promise<T|TResult>}
   *
      ip:port/queryTxForSign/:chainType
        { status: false } 
        { status: true,
          result: [
             {
                chainType:
                uniqueId:
                dataHash: 
                rawData: "..."
             }
             ...
          ]
        }

   */
  queryTxForSign(chainType, pk) {
    return doHttpGet(this.url + '/queryTxForSign' + `/${chainType}` + `/${pk}`)
  }


  /**
   *
   * @param chainType
   * @return {Promise<T|TResult>}
   *
    ip:port/addTxSignature/:chainType
    POST
     {
       uniqueId:
       pk: 
       dataHash:,
       signature: 
     }

      signInfo:[
        ...
        {
          pk: pk,
          signature: "...",
          timestamp: _.now()
        }
      ]

     { status: true } 
          { status: false }
   */
  addTxSignature(chainType, txObj) {
    return doHttpPost(this.url + '/addTxSignature' + `/${chainType}`, txObj)
  }

  /**
 *
 * @param chainType
 * @return {Promise<T|TResult>}
 *
  ip:port/queryTxSignature/:chainType/:uniqueId
  GET

     {
       "status": true,
       "result": {
         count:3,
         signatures:[]
       }
     }

      { status: true,
        result: {
         count:4,
         signatures:[
           {
             pk:..,
             signature:hex....
           }
           ....
         ]
       ]
     }

 */
  queryTxSignature(chainType, uniqueId) {
    return doHttpGet(this.url + '/queryTxSignature' + `/${chainType}` + `/${uniqueId}`)
  }
}

module.exports = { ServerAPI }
