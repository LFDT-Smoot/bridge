/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { isConnected, setAllowed, getNetwork, getPublicKey, signTransaction } from "@stellar/freighter-api";

export default class FreighterWallet {
  constructor() {
    this.name = "Freighter";
  }

  // standard function

  async getNetwork() {
    try {
      let network = await getNetwork();
      return network;
    } catch (err) {
      console.error("%s getNetwork error: %O", this.name, err);
      return "";
    }
  }

  async getAccounts() {
    try {
      if (await isConnected()) {
        if (await setAllowed()) {
          let pk = await getPublicKey();
          return [pk];
        } else {
          throw new Error("Not allowed");
        }
      } else {
        throw new Error("Not installed");
      }
    } catch (err) {
      console.error("%s getAccounts error: %O", this.name, err);
      throw new Error("Unknown error");
    }
  }

  async signTransaction(txXdr, opts) {
    let signedTx = await signTransaction(txXdr, opts);
    console.log("FreighterWallet signTransaction from %s to: %O", txXdr, signedTx);
    return signedTx;
  }
}