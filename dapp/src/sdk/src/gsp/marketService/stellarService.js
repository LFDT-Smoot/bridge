/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Contract, SorobanRpc, TransactionBuilder, Networks, BASE_FEE, Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import * as tool from "../../utils/tool.js";

export default class StellarService {
  async init(frameworkService) {
    this.frameworkService = frameworkService;
    let chainInfoService = frameworkService.getService("ChainInfoService");
    let chainInfo = chainInfoService.getChainInfoByName("Stellar");
    this.chainInfo = chainInfo;
    this.rpc = chainInfo.rpc;
    this.server = new SorobanRpc.Server(chainInfo.rpc);
    this.marketSc = new Contract(chainInfo.marketScAddr);
    this.wmbSc = new Contract(chainInfo.wmbScAddr);
  }

  async getNftBalance(owner) {
    let balance = 0; // TODO
    return balance;
  }

  async getNfts(owner, pageSize, pageIndex) {
    let nfts = []; // TODO
    return nfts;
  }

  async getWmbFee(targetChainId, gasLimit) {
    let fee = 0; // contract do not require fee now
    console.debug("StellarService getWmbFee: %O", {targetChainId, gasLimit, fee});
    return fee;
  }

  async buildSellOrderTx(seller, tokenId, price, recipient, options) {
    console.log("StellarService buildSellOrderTx input: %O", {seller, tokenId, price, recipient, BASE_FEE, options});
    let sourceAccount = await this.server.getAccount(seller);
    let tx = new TransactionBuilder(sourceAccount, {fee: BASE_FEE, networkPassphrase: Networks[this.chainInfo.network]})
    .addOperation(this.marketSc.call("create_order",
      nativeToScVal(new Address(seller), {type:'Address'}),
      nativeToScVal("CreateOrder", {type: "string"}),
      nativeToScVal(new Address("CCFZO74QWNAHBAH4N7RW4YQWQZUPRZ7LFGJE63KVQTLPNRDIMCFW2ZXL"), {type:"Address"}), // now only one nft
      nativeToScVal(tokenId, {type:"i128"}),
      xdr.ScVal.scvBytes("0000000000000000000000000000000000000000"), // now only MATIC as price token
      nativeToScVal(price, {type:'i128'}),
      xdr.ScVal.scvBytes(tool.hexStrip0x(recipient)),
      new Address(seller).toScVal()
    ))
    .setTimeout(30)
    .build();
    console.debug("StellarService buildSellOrderTx TransactionBuilder: %O", tx);
    let preparedTx = await this.server.prepareTransaction(tx);
    console.debug("StellarService buildSellOrderTx prepareTransaction: %O", preparedTx);
    return preparedTx;
  }

  async buildCancelOrderTx(seller, orderKey, options) {
    console.log("StellarService buildCancelOrderTx input: %O", {seller, orderKey, options});
    let sourceAccount = await this.server.getAccount(seller);
    let tx = new TransactionBuilder(sourceAccount, {fee: BASE_FEE, networkPassphrase: Networks[this.chainInfo.network]})
    .addOperation(this.marketSc.call("cancel_order",
      nativeToScVal(new Address(seller), {type:'Address'}),
      nativeToScVal(new Buffer.from(tool.hexStrip0x(orderKey), 'hex'))
    ))
    .setTimeout(30)
    .build();
    console.log("StellarService buildCancelOrderTx TransactionBuilder: %O", tx);
    let preparedTx = await this.server.prepareTransaction(tx);
    console.log("StellarService buildCancelOrderTx prepareTransaction: %O", preparedTx);
    return preparedTx;
  }

  async buildTransferNftTx(sender, tokenId, recipient) {
    console.log("StellarService buildTransferNftTx input: %O", {sender, tokenId, recipient, BASE_FEE});
    let sourceAccount = await this.server.getAccount(sender);
    let tokenSc = new Contract("CCFZO74QWNAHBAH4N7RW4YQWQZUPRZ7LFGJE63KVQTLPNRDIMCFW2ZXL"); // now only one nft
    let tx = new TransactionBuilder(sourceAccount, {fee: BASE_FEE, networkPassphrase: Networks[this.chainInfo.network]})
    .addOperation(tokenSc.call("transfer",
      nativeToScVal(new Address(sender), {type:'Address'}),
      nativeToScVal(new Address(recipient), {type:"Address"}),
      nativeToScVal(tokenId, {type:'i128'})
    ))
    .setTimeout(30)
    .build();
    console.debug("StellarService buildTransferNftTx TransactionBuilder: %O", tx);
    let preparedTx = await this.server.prepareTransaction(tx);
    console.debug("StellarService buildTransferNftTx prepareTransaction: %O", preparedTx);
    return preparedTx;
  }

  async sendTx(signedTx) {
    let tx = TransactionBuilder.fromXDR(signedTx, this.rpc);
    console.log("StellarService sendTx from %s to %O", signedTx, tx);
    let response = await this.server.sendTransaction(tx);
    console.log("StellarService sendTx response: %O", response);
    // wait receipt
    if (response.status === "PENDING") {
      let receipt;
      for (let i = 0; i < 60; i++) {
        receipt = await this.server.getTransaction(response.hash);
        if (receipt.status === "NOT_FOUND") {
          console.debug("StellarService wait %d/60 for tx %s receipt", i, response.hash);
          await tool.sleep(1000);
        } else {
          break;
        }
      }
      console.debug("StellarService tx %s receipt: %O", response.hash, receipt);
      if (receipt.status === "SUCCESS") {
        if (!receipt.resultMetaXdr) {
          throw new Error("Empty resultMetaXDR in transaction receipt");
        }
      }
      return receipt;
    } else {
      throw response.errorResult;
    }
  }
};
