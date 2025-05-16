/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { createGlobalStore } from 'hox';
import { useCallback, useEffect, useState } from 'react';
import { NftMarket } from '../sdk';

// export const network = ['nft-rust-nu.vercel.app'].includes(document.domain)
//   ? 'mainnet'
//   : 'testnet';
export const network = 'testnet';
const nftMarketInstance = new NftMarket(network);

const useSDK = () => {
  const [nftMarket, setNftMarket] = useState(nftMarketInstance);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNftMarket(nftMarketInstance);
  }, [])

  useEffect(() => {
    const init = async () => {
      await nftMarket.init();
      setLoading(false);
    }
    init()
  }, [nftMarket]);

  const checkWallet = useCallback(async (...args) => {
    const fn = await nftMarket.checkWallet(...args);
    return fn;
  }, [nftMarket]);

  const validateAddress = useCallback(
    (...args) => {
      return nftMarket.validateAddress(...args);
    },
    [nftMarket],
  );

  return {
    nftMarket,
    checkWallet,
    validateAddress,
    loading,
  };
};

export const [useSDKStore] = createGlobalStore(useSDK);

export default useSDKStore;
