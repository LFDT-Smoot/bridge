/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { network } from '@/models/useSdk';
import React from 'react';
import { Web3Wallet, FreighterWallet } from '@/sdk';
import metamaskIcon from 'images/metamask.webp';
import stellarIcon from 'images/stellarIcon.png';

const INITIAL_STATE = {
  polygonAddress: '',
  stellarAddress: '',
  curPolygonAddress: '',
  curStellarAddress: '',
  polygonConnected: false,
  stellarConnected: false,
  toConnected: false,
  networkId: network === 'testnet' ? 999 : 888, // TODO: CHANGE TO 888 AFTER JUPITER FORK
  polygonWallet: null,
  stellarWallet: null,
  polygonProvider: null,
  stellarProvider: null,
};

const differ = (a, b) => {
  if (a.polygonAddress !== b.polygonAddress) {
    return 1;
  }

  if (a.stellarAddress !== b.stellarAddress) {
    return 1;
  }

  if (a.networkId !== b.networkId) {
    return 1;
  }

  if (a.polygonConnected !== b.polygonConnected) {
    return 1;
  }

  if (a.stellarConnected !== b.stellarConnected) {
    return 1;
  }

  return 0;
};

export const WalletContext = React.createContext({}, differ);

class Wallet extends React.Component {
  constructor(props) {
    super(props);
    const intiState = {
      ...INITIAL_STATE,
      resetApp: this.resetApp,
      connect: this.onConnect,
      getLogo: this.getLogo,
    };
    console.log('props', props)
    this.setWallet = props.setWallet;
    this.setWallet(intiState);
  }

  async componentDidMount() {
    const polygonConnected = window.localStorage.getItem('polygonConnected');
    const stellarConnected = window.localStorage.getItem('stellarConnected');
    polygonConnected && this.onConnect('metamask');
    stellarConnected && this.onConnect('stellar');
  }

  onConnect = async (name) => {
    if (name === 'metamask' && this.props.wallet) {
      this.removeListienr(this.props.wallet.polygonWallet);
    }

    try {
      let polygonWallet, stellarWallet, accounts, polygonAddress, stellarAddress, polygonProvider, stellarProvider, polygonConnected, stellarConnected;
      if (name === 'metamask') {
        if (!window.ethereum) {
          console.error('window.ethereum undefind');
          return;
        }
        polygonWallet = new Web3Wallet(window.ethereum);
        console.log('polygonWallet', polygonWallet.web3.currentProvider)
        accounts = await polygonWallet.getAccounts(network);
        polygonAddress = accounts[0];
        polygonProvider = polygonWallet.web3.currentProvider;
        polygonConnected = true;
        await this.subscribeProvider(polygonProvider);
        console.log('wallet', polygonWallet, accounts, polygonAddress);
        await this.setWallet({
          ...this.props.wallet,
          polygonWallet,
          polygonAddress,
          polygonProvider,
          polygonConnected,
        });
        window.localStorage.setItem('polygonConnected', true);
      } else {
        stellarWallet = new FreighterWallet();
        accounts = await stellarWallet.getAccounts();
        stellarAddress = accounts[0];
        stellarProvider = stellarWallet;
        stellarConnected = true;
        await this.setWallet({
          ...this.props.wallet,
          stellarWallet,
          stellarAddress,
          stellarProvider,
          stellarConnected,
        });
        window.localStorage.setItem('stellarConnected', true);
      }
      
    } catch (e) {
      console.error(e);
    }
  };

  accountsChanged = async (accounts) => {
    await this.setWallet({ ...this.props.wallet, polygonAddress: accounts[0] });
  };

  subscribeProvider = async (provider) => {
    if (!provider || !provider.on) {
      return;
    }
    provider.on('close', this.resetApp);
    provider.on('accountsChanged', this.accountsChanged);

  };

  removeListienr = async (provider) => {
    if (!provider || !provider.off) {
      return;
    }
    provider.off('close', this.resetApp);
    provider.off('accountsChanged', this.accountsChanged);
  }

  resetApp = async () => {
    const { polygonWallet } = this.props.wallet;
    if (!polygonWallet) return;
    if (polygonWallet && polygonWallet.currentProvider && polygonWallet.currentProvider.close) {
      await polygonWallet.currentProvider.close();
    }
    if (polygonWallet && polygonWallet.currentProvider && polygonWallet.currentProvider.removeAllListeners) {
      polygonWallet.currentProvider.removeAllListeners();
    }
    
    this.setWallet({
      ...INITIAL_STATE,
      resetApp: this.resetApp,
      connect: this.onConnect,
      getLogo: this.getLogo,
    });
  };

  getLogo = (name) => {
    if (name === 'metamask') {
      return metamaskIcon;
    } else {
      return stellarIcon;
    }
  };

  render() {
    return <></>;
  }
}

export default Wallet;
