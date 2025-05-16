/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import Web3 from 'web3';
import { aggregate } from '@makerdao/multicall';
import BigNumber from 'bignumber.js';
import * as tool from "../../utils/tool.js";

export default class PolygonService {
  async init(frameworkService) {
    this.frameworkService = frameworkService;
    let chainInfoService = frameworkService.getService("ChainInfoService");
    let chainInfo = chainInfoService.getChainInfoByName("Polygon");
    this.chainInfo = chainInfo;
    this.web3 = new Web3(new Web3.providers.HttpProvider(chainInfo.rpc));
    let configService = frameworkService.getService("ConfigService");
    let marketAbi = configService.getAbi("nftMarket");
    this.marketSc = new this.web3.eth.Contract(marketAbi, chainInfo.marketScAddr);
    let wmbAbi = configService.getAbi("wmb");
    this.wmbSc = new this.web3.eth.Contract(wmbAbi, chainInfo.wmbScAddr);
    this.mcCfg = {
      rpcUrl: chainInfo.rpc,
      multicallAddress: chainInfo.multicallScAddr
    };
  }

  async getNftBalance(owner) {
    let balance = await this.marketSc.methods.balanceOf(owner).call();
    return balance;
  }

  async getNfts(owner, pageSize, pageIndex) {
    let balance = await this.marketSc.methods.balanceOf(owner).call();
    let skip = pageSize * pageIndex;
    if (skip >= balance) {
      return [];
    }
    let tokenAddress = this.chainInfo.marketScAddr;
    let cnt = (skip + pageSize) > balance? (balance - skip) : pageSize;
    // ids
    let idCalls = [];
    for (let i = 0; i < cnt; i++) {
      idCalls.push({
        target: tokenAddress,
        call: ['tokenOfOwnerByIndex(address,uint256)(uint256)', owner, i + skip],
        returns: [[i]]
      });
    }
    let res = await aggregate(idCalls, this.mcCfg);
    let ids = res.results.transformed;
    let nfts = [];
    for (let i = 0; i < cnt; i++) {
      nfts.push({wrappedId: new BigNumber(ids[i]).toFixed()});
    }
    // stellar nftInfo
    let infoCalls = nfts.map((v, i) => {
      return {
        target: tokenAddress,
        call: ['stellarNFTs(uint256)(bytes,uint256)', v.wrappedId],
        returns: [
          [i + '_nftContract'],
          [i + '_nftId']
        ]
      }
    });
    res = await aggregate(infoCalls, this.mcCfg);
    let infos = res.results.transformed;
    for (let i = 0; i < cnt; i++) {
      nfts[i].id = new BigNumber(infos[i + '_nftId']).toFixed();
    }
    return nfts;
  }

  async getOrderInfo(orderKey) { // {nftContract, nftId, priceToken, price, recipent}
    orderKey = '0x' + tool.hexStrip0x(orderKey);
    let info = await this.marketSc.methods.orderInfos(orderKey).call();
    return info;
  }

  async getWmbFee(targetChainId, gasLimit) {
    let fee = await this.wmbSc.methods.estimateGas(targetChainId, gasLimit, "0x").call();
    console.debug("PolygonService getWmbFee: %O", {targetChainId, gasLimit, fee});
    return fee;
  }

  async getBuyNftTxData(orderKey, estimateOptions) { // orderKey: keccak256(nftContract, nftId, priceToken, recipient)
    console.log("PolygonService getBuyNftTxData input: %O", {orderKey, estimateOptions});
    orderKey = '0x' + tool.hexStrip0x(orderKey);
    let data = this.marketSc.methods.buyOrder(orderKey).encodeABI();
    let gasLimit = await this.marketSc.methods.buyOrder(orderKey).estimateGas(estimateOptions);
    console.debug("PolygonService getBuyNftTxData estimateGas: %s", gasLimit);
    gasLimit = "0x" + new BigNumber(new BigNumber(gasLimit).times(1.1).toFixed(0)).toString(16);
    return {data, gasLimit};
  }

  async getUnwrapNftTxData(from, to, tokenId, recipient, estimateOptions) {
    // safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data)
    let recipientHex = this.web3.utils.asciiToHex(recipient);
    console.log("PolygonService getUnwrapNftTxData input: %O", {from, to, tokenId, recipient, estimateOptions, recipientHex});
    let data = this.marketSc.methods.safeTransferFrom(from, to, tokenId, recipientHex).encodeABI();
    let gasLimit = await this.marketSc.methods.safeTransferFrom(from, to, tokenId, recipientHex).estimateGas(estimateOptions);
    console.debug("PolygonService getUnwrapNftTxData estimateGas: %s", gasLimit);
    gasLimit = "0x" + new BigNumber(new BigNumber(gasLimit).times(1.1).toFixed(0)).toString(16);
    return {data, gasLimit};
  }
};
