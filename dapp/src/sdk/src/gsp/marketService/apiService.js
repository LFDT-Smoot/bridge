/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import axios from "axios";
import BigNumber from "bignumber.js";

export default class ApiService {
  async init(frameworkService) {
    this.frameworkService = frameworkService;
    let configService = frameworkService.getService("ConfigService");
    let apiServer = configService.getGlobalConfig("apiServer");
    this.url = apiServer.url;
  }

  async _getFetch(url) {
    let res = await axios.get(url);
    if (res.data.status) {
      return res.data.result;
    } else {
      console.error("ApiService %s _getFetch error: %O", url);
      return null;
    }
  }

  async _postFetch(url, data) {
    let res = await axios.post(url, data);
    if (res.data.status) {
      return res.data.result;
    } else {
      console.error("ApiService %s _postFetch error: %O", url, data);
      return null;
    }
  }

  async getOrderCount(options) { // {status[], xlmAddr, maticAddr}
    let data = await this._postFetch(this.url + "/queryOrderCount", options);
    return data || 0;
  }

  async getOrders(options) { // {status[], xlmAddr, maticAddr, pageIndex, pageSize}, {nftContract, nftId, priceToken, price, recipient, xlmOrderKey, xlmAddr, status, maticOrderKey, maticAddr, timestamp}
    let data = await this._postFetch(this.url + "/queryOrder", options);
    let orders = data || [];
    orders.forEach(order => order.price = new BigNumber(order.price || 0).div(Math.pow(10 , 18)).toFixed());
    return orders;
  }

  async getNftBalance(owner) {
    let data = await this._getFetch(this.url + "/nft/balanceOf/" + owner);
    return data || 0;
  }

  async getNfts(options) { // {address, pageIndex, pageSize}
    let data = await this._postFetch(this.url + "/nft/queryNftIds", options);
    return data || [];
  }

  async getNftUri(tokenId) { // get function also consume gas, it not suitable get from chain
    return this.url + "/nft/metadata/" + tokenId;
  }

  async getNftMetadata(uri) { // {name, description, image}
    let data = await this._getFetch(uri);
    if (data && data.image) {
      if (data.image.indexOf("://") < 0) { // relative path
        data.image = this.url + data.image;
      }
    }
    return data;
  }
};
