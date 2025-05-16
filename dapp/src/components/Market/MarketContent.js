/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef, useMemo } from "react";
import styled from 'styled-components';
import NftMarketItem from "./NftMarketItem";
import useSdk from '@/models/useSdk';
import { Spin } from 'antd';

let timer = null;

const MarketContent = (props) => {
  const {
    filterTxt
  } = props;
  const { nftMarket, loading } = useSdk();
  const [handleNftList, setHandlNftList] = useState([]);
  const [marketList, setMarketList] = useState([]);
  const itemDom = useRef(null);
  let polling = useRef();
  const [showPageLoading, setShowPageLoading] = useState(false);

  const getList = async () => {
    try {
      const num = await nftMarket.getMarketOrderNumber();
      if (String(num) === '0') {
        console.log('market order num is null');
        setShowPageLoading(false);
        return;
      };
      let list = await nftMarket.getMarketOrders(num, 0);
      if (!list || !list.length) {
        console.log('market list is null');
        setShowPageLoading(false);
        return;
      };
      list = JSON.parse(JSON.stringify(list));
      console.log('get market list %o: ', list);
      const ids = list.map(v => v.nftId);
      const res = await nftMarket.getNftInfo(ids);
      console.log('res', list, res)
      const carr = list.map(v => {
        const nftData = res.find(item => v.nftId === item.id);
        if (!nftData) return null;
        if (v.status !== 'onsale') return null;
        return Object.assign({}, v, nftData);
      }).filter(v => !!v);
      setMarketList(carr);
      setShowPageLoading(false);
    } catch (e) {
      console.error('get market list error: ', e);
    }
  }

  useEffect(() => {
    if (loading) return;
    setShowPageLoading(true);
    getList();

    polling.current = setInterval(() => {
      getList();
    }, 5000);

    return () => clearInterval(polling.current);
  }, [loading]);
  
  const handleFitContentStyleFn = (array) => {
    const defaultArr = array ? array : marketList;
    const w = window.document.body.offsetWidth - 200;
    const itemWidth = itemDom.current?.children[0]?.offsetWidth;
    console.log('itemWidth', itemDom, itemDom.current?.children[0]?.offsetWidth, defaultArr.length);
    if (!defaultArr.length) return [];
    const num = Math.floor(w / itemWidth);
    const sn = num - defaultArr.length % num;
    let arr1 = JSON.parse(JSON.stringify(defaultArr));
    for(let i = 0; i < sn; i++) {
      arr1.push({
        "nftContract": "CAK3YU4RRTL6BFHK6ES5N7346OVKZGTVO4XNPKVBWQMS4UT6NPXL4IEH",
        "nftId": "40003",
        "priceToken": "0xbb4e992daa6a51872c15bf9db8f072624b91d37b",
        "recipient": "0xbb4e992daa6a51872c15bf9db8f072624b91d37b",
        "xlmOrderKey": "75b5e5df5cfb46f678c4d38e99a1deae16b1f6d16d0a0cf36abd5a1373730444",
        "status": "listing",
        "xlmCreateOrder": {
            "buyer": "GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4",
            "messageType": "CreateOrder",
            "nftContract": "CAK3YU4RRTL6BFHK6ES5N7346OVKZGTVO4XNPKVBWQMS4UT6NPXL4IEH",
            "nftId": "40003",
            "price": "123456",
            "priceToken": "0xbb4e992daa6a51872c15bf9db8f072624b91d37b",
            "recipient": "0xbb4e992daa6a51872c15bf9db8f072624b91d37b",
            "orderKey": "75b5e5df5cfb46f678c4d38e99a1deae16b1f6d16d0a0cf36abd5a1373730444"
        },
        "id": "40003",
        "uri": "https://stellardemo.wanscan.org:6001/nft/metadata/40003",
        "metadata": {
            "name": "40003 token name",
            "description": "40003 description",
            "image": "https://stellardemo.wanscan.org:6001/nft/image/1.jpg"
        }
    })
    }
    arr1 = arr1.map((v, i) => {
      return {
        ...v,
        isHidden: arr1.length - 1 - i < sn
      };
    });

    console.log('window size: %s; num: %s; sn: %s; marketList.length: %s; num%: %s; arr1, array', w, num, sn, marketList.length, marketList.length % num, arr1)
    return arr1;
  }

  const filterList = useMemo(() => {
    const arr = marketList.filter(v => {
      const name = String(v.metadata.name).toLocaleLowerCase();
      const description = String(v.metadata.description).toLocaleLowerCase();
      const id = String(v.metadata.id);
      const txt = String(filterTxt).toLocaleLowerCase();
      return name.includes(txt) || description.includes(txt) || id.includes(txt);
    })
    return arr;
  }, [marketList, filterTxt])

  useEffect(() => {
    timer = setTimeout(async () => {
      const defaultArr = handleFitContentStyleFn(filterList);
      setHandlNftList(defaultArr);
    }, 0);
    return () => clearTimeout(timer);
  }, [filterList]);

  window.onresize = () => {
    const defaultArr = handleFitContentStyleFn(filterList);
    setHandlNftList(defaultArr);
  };

  return (
    <Spin spinning={showPageLoading}>
      <Body ref={itemDom}>
        {
          handleNftList.map((v, i) => (
            <NftMarketItem key={i} data={v} isHidden={v.isHidden}></NftMarketItem>
          ))
        }
      </Body>
    </Spin>
  )
};

export default MarketContent;

const Body = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-content: flex-start;
  min-height: 460px;
`;
