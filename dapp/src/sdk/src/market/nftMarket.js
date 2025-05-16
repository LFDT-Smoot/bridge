/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import StartService from '../gsp/startService/startService.js';
import OrderTask from './orderTask.js';
import WAValidator from 'multicoin-address-validator';
import BigNumber from 'bignumber.js';

export default class NftMarket {
  constructor(network = "testnet") {
    this.network = (network === "mainnet")? "mainnet" : "testnet";
  }

  async init() {
    console.debug("SDK: init, network: %s, ver: 2406031612", this.network);
    this._service = new StartService();
    await this._service.init(this.network);
    this.configService = this._service.getService("ConfigService");
    this.chainInfoService = this._service.getService("ChainInfoService");
    this.taskHandleService = this._service.getService("TaskHandleService");
    this.actionHandleService = this._service.getService("ActionHandleService");
    await this._service.start();
  }

  async checkWallet(chainName, wallet) {
    console.debug("SDK: checkWallet, chainName: %s, wallet: %s", chainName, wallet? wallet.name : undefined);
    let chainInfo = this.chainInfoService.getChainInfoByName(chainName);
    if (chainInfo.network !== undefined) {
      if (wallet) {
        let network = await wallet.getNetwork();
        if (String(chainInfo.network) === String(network)) {
          return true;
        } else {
          console.debug("SDK: checkWallet network %s != %s", network, chainInfo.network);
          return false;
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  validateAddress(chainName, address) {
    let valid = WAValidator.validate(address, chainName);
    if (valid === false) {
      console.log("SDK: validateAddress, chainName: %s, address: %s, result: %s", chainName, address, valid);
      return false;
    }
    return true;
  }

  async getNftBalance(chainName, owner, status = ["normal"]) { // normal, listing, onsale, canceling
    console.debug("SDK: getNftBalance, options: %O", {chainName, owner, status});
    let marketService, balance;
    if (status[0] === "normal") { // Polygon, Stellar
      if (chainName === "Stellar") { // stellar contract do not yet support nft traversal, used apiServer as workaround
        marketService = this._service.getService("ApiService");
        balance = await marketService.getNftBalance(owner);
      } else {
        marketService = this._service.getService(chainName + "Service");
        balance = await marketService.getNftBalance(owner, status);
      }
    } else { // Stellar
      marketService = this._service.getService("ApiService");
      let options = {status, xlmAddr: owner};
      balance = await marketService.getOrderCount(options);
    }
    console.debug("SDK: getNftBalance, result: %O", balance);
    return balance;
  }

  async getNfts(chainName, owner, pageSize, pageIndex, status = ["normal"]) { // normal, listing, onsale, canceling
    console.debug("SDK: getNfts, options: %O", {chainName, owner, pageSize, pageIndex, status});
    let marketService, nfts;
    if (status[0] === "normal") { // Polygon, Stellar
      if (chainName === "Stellar") { // stellar contract do not yet support nft traversal, used apiServer as workaround
        marketService = this._service.getService("ApiService");
        let options = {address: owner, pageIndex, pageSize};
        let nftIds = await marketService.getNfts(options);
        nfts = nftIds.map(v => {
          return {id: v}
        });
      } else { // Polygon
        marketService = this._service.getService(chainName + "Service");
        nfts = await marketService.getNfts(owner, pageSize, pageIndex);
      }
    } else { // Stellar
      marketService = this._service.getService("ApiService");
      let options = {status, xlmAddr: owner, pageSize, pageIndex};
      let orders = await marketService.getOrders(options);
      nfts = orders.map(v => {
        v.id = v.nftId;
        return v;
      });
    }
    // get uri
    marketService = this._service.getService("ApiService");
    if (nfts.length) {
      let uris = await Promise.all(nfts.map(v => marketService.getNftUri(v.id)));
      console.log("nft uris: %O", uris);
      let metadatas = await Promise.all(uris.map(uri => marketService.getNftMetadata(uri)));
      nfts.forEach((v, i) => {
        v.uri = uris[i];
        v.metadata = metadatas[i];
      });
    }
    console.debug("SDK: getNfts, result: %O", nfts);
    return nfts;
  }

  async createSellOrder(tokenId, price, toAccount, fromAccount, wallet) {
    console.debug("SDK: createSellOrder, options: %O", this._getDebugOptions({tokenId, price, toAccount, fromAccount, wallet}));
    // check fromAddress
    if (!this.validateAddress("Stellar", fromAccount)) {
      throw new Error("Invalid fromAccount");
    }
    // check toAddress
    if (!this.validateAddress("Ethereum", toAccount)) {
      throw new Error("Invalid toAccount");
    }
    // create task
    let options = {tokenId, price, toAccount};
    let task = new OrderTask(this, "StellarSellOrder", "Stellar", fromAccount, wallet, options);
    await task.start();
    return task;
  }

  async cancelSellOrder(orderKey, fromAccount, wallet) { // Stellar orderKey
    console.debug("SDK: cancelSellOrder, options: %O", this._getDebugOptions({orderKey, fromAccount, wallet}));
    // create task
    let options = {orderKey};
    let task = new OrderTask(this, "StellarCancelOrder", "Stellar", fromAccount, wallet, options);
    await task.start();
    return task;
  }

  async transferNft(tokenId, toAccount, fromAccount, wallet) {
    console.debug("SDK: transferNft, options: %O", this._getDebugOptions({tokenId, toAccount, fromAccount, wallet}));
    // create task
    let options = {tokenId, toAccount};
    let task = new OrderTask(this, "StellarTransferNft", "Stellar", fromAccount, wallet, options);
    await task.start();
    return task;
  }

  async buy(orderKey, fromAccount, wallet) { // Polygon orderKey
    console.debug("SDK: buy, options: %O", this._getDebugOptions({orderKey, fromAccount, wallet}));
    // create task
    let options = {orderKey};
    let task = new OrderTask(this, "EvmBuyNft", "Polygon", fromAccount, wallet, options);
    await task.start();
    return task;
  }

  async unwrap(tokenId, toAccount, fromAccount, wallet) {
    console.debug("SDK: unwrap, options: %O", this._getDebugOptions({tokenId, toAccount, fromAccount, wallet}));
    // create task
    let options = {tokenId, toAccount};
    let task = new OrderTask(this, "EvmUnwrapNft", "Polygon", fromAccount, wallet, options);
    await task.start();
    return task;
  }

  async getWmbFee(fromChainName, toChainName) {
    console.debug("SDK: getWmbFee, options: %O", {fromChainName, toChainName});
    let fromChainInfo = this.chainInfoService.getChainInfoByName(fromChainName);
    let toChainInfo = this.chainInfoService.getChainInfoByName(toChainName);
    let marketService = this._service.getService(fromChainName + "Service");
    let fee = await marketService.getWmbFee(toChainInfo.chainId, toChainInfo.wmbGas);
    let decimalsFee = new BigNumber(fee).div(Math.pow(10, fromChainInfo.chainDecimals)).toFixed();
    console.debug("SDK: getWmbFee, result: %s", decimalsFee);
    return decimalsFee;
  }

  async getMyHistoryNumber(stellarAddress, polygonAddress, status = ["success"]) {
    console.debug("SDK: getMyHistoryNumber, options: %O", {stellarAddress, polygonAddress, status});
    if (!(stellarAddress || polygonAddress)) {
      return 0;
    }
    let marketService = this._service.getService("ApiService");
    let options = {
      status,
      xlmAddr: stellarAddress || "",
      maticAddr: polygonAddress || ""
    };
    let number = await marketService.getOrderCount(options);
    console.debug("SDK: getMyHistoryNumber, result: %d", number);
    return number;
  }

  async getMyHistory(stellarAddress, polygonAddress, pageSize, pageIndex, status = ["success"]) {
    console.debug("SDK: getMyHistory, options: %O", {stellarAddress, polygonAddress, pageSize, pageIndex, status});
    if (!(stellarAddress || polygonAddress)) {
      return [];
    }
    let marketService = this._service.getService("ApiService");
    let options = {
      status,
      xlmAddr: stellarAddress || "",
      maticAddr: polygonAddress || "",
      pageSize,
      pageIndex
    };
    let orders = await marketService.getOrders(options);
    console.debug("SDK: getMyHistory, result: %O", orders);
    return orders;
  }

  async getMarketHistoryNumber(status = ["success"]) {
    console.debug("SDK: getMarketHistoryNumber, options: %O", {status});
    let marketService = this._service.getService("ApiService");
    let options = {status};
    let number = await marketService.getOrderCount(options);
    console.debug("SDK: getMarketHistoryNumber, result: %d", number);
    return number;
  }

  async getMarketHistory(pageSize, pageIndex, status = ["success"]) {
    console.debug("SDK: getMarketHistory, options: %O", {pageSize, pageIndex, status});
    let marketService = this._service.getService("ApiService");
    let options = {
      status,
      pageSize,
      pageIndex
    };
    let orders = await marketService.getOrders(options);
    console.debug("SDK: getMarketHistory, result: %O", orders);
    return orders;
  }

  async getMarketOrderNumber(status = ["onsale"]) {
    console.debug("SDK: getMarketOrderNumber, options: %O", {status});
    let marketService = this._service.getService("ApiService");
    let options = {status};
    let number = await marketService.getOrderCount(options);
    console.debug("SDK: getMarketOrderNumber, result: %d", number);
    return number;
  }

  async getMarketOrders(pageSize, pageIndex, status = ["onsale"]) {
    console.debug("SDK: getMarketOrders, options: %O", {pageSize, pageIndex, status});
    let marketService = this._service.getService("ApiService");
    let options = {
      status,
      pageSize,
      pageIndex
    };
    let orders = await marketService.getOrders(options);
    console.debug("SDK: getMarketOrders, result: %O", orders);
    return orders;
  }

  async getNftInfo(tokenIds) {
    console.debug("SDK: getNftInfo, options: %O", {tokenIds});
    let marketService = this._service.getService("ApiService");
    let uris = await Promise.all(tokenIds.map(id => marketService.getNftUri(id)));
    console.log("nft uris: %O", uris);
    let metadatas = await Promise.all(uris.map(uri => marketService.getNftMetadata(uri)));
    let infos = tokenIds.map((id, i) => {
      return {id, uri: uris[i], metadata: metadatas[i]};
    });
    console.debug("SDK: getNftInfo, result: %O", infos);
    return infos;
  }

  _getDebugOptions(options) {
    let opt = Object.assign({}, options);
    // only display wallet name
    if (opt.wallet) {
      opt.wallet = opt.wallet.name;
    }
    return opt;
  }
}