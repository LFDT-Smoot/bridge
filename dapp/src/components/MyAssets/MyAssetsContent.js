/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from "react";
import styled from 'styled-components';
import MyAssetsItem from "./MyAssetsItem";
import useSdk from '@/models/useSdk';
import useFormDataModal from "@/models/useFormData";
import { WalletContext } from "@/wallet/connect";
import { Spin } from 'antd';

let time = null;

const MyAssetsContent = (props) => {
  const {
    filterTxt
  } = props;
  const { nftMarket } = useSdk();
  const wallet = useContext(WalletContext);
  const { data, loading } = useFormDataModal();
  const [nftList, setNftList] = useState([]);
  const [handleNftList, setHandlNftList] = useState([]);
  const itemDom = useRef(null);
  let timer = useRef();
  const [filterType, setFilterType] = useState('Polygon');
  const [showStellar, setShowStellar] = useState(false);
  const [stellarFilterArr, setStellarFilterArr] = useState(['Available']);
  const [showPageLoading, setShowPageLoading] = useState(true);
  const [nftListData, setNftListData] = useState({});

  const getNftListFn = useCallback(async () => {
    try {
      if (loading) return;
      // chainName, owner, status = ["normal"]
      const chainName = showStellar ? 'Stellar' : 'Polygon';
      const owner = showStellar ? data.stellarAddress : data.polygonAddress;
      if (!owner) return;
      const statusArr = stellarFilterArr.map(v => {
        let value = String(v).toLocaleLowerCase();
        if (value === 'available') {
          value = 'normal';
        }
        return value;
      });
      const balance = await nftMarket.getNftBalance(chainName, owner , statusArr);
      const key = showStellar ? stellarFilterArr.sort().join('-') : 'Polygon';
      let obj = JSON.parse(JSON.stringify(nftListData));
      console.log('get my assets  balance', balance);
      if (String(balance) === '0') {
        setShowPageLoading(false);
        if (obj[key] && obj[key].length === 0) {
          return;
        }
        obj[key] = [];
        setNftListData(obj);
        return;
      };
      // chainName, owner, pageSize, pageIndex, status = ["normal"]
      let list = await nftMarket.getNfts(chainName, owner, balance, 0, statusArr);
      list = JSON.parse(JSON.stringify(list));
      if (JSON.stringify(list) === JSON.stringify(obj[key])) {
        setShowPageLoading(false);
        return;
      }
      obj[key] = list;
      setNftListData(obj);
      setShowPageLoading(false);
      console.log('get my assets  balance: %s  list: %o    key: %s', balance, list, key);
    } catch (e) {
      console.error('get my assets error: o%', e)
    }
  }, [data.stellarAddress, data.polygonAddress, showStellar, stellarFilterArr, nftMarket, loading, nftListData]);

  useEffect(() => {
    timer.current && clearInterval(timer.current);
    getNftListFn();

    timer.current = setInterval(async () => {
      await getNftListFn();
    }, 10000);

    return () => clearInterval(timer.current);
  }, [getNftListFn])
  
  const handleFitContentStyleFn = (array) => {
    const defaultArr = array ? array : nftList
    const w = window.document.body.offsetWidth - 200;
    const itemWidth = itemDom.current?.children[0]?.offsetWidth ?? 394;
    console.log('itemWidth', itemDom, itemDom.current?.children[0]?.offsetWidth, defaultArr.length);
    if (!defaultArr.length) return [];
    const num = Math.floor(w / itemWidth);
    const sn = num - defaultArr.length % num;
    let arr1 = JSON.parse(JSON.stringify(defaultArr));
    for(let i = 0; i < sn; i++) {
      arr1.push({
        src: '',
        id: '#447',
        metadata: {
          name: '',
          description: '',
          image: ''
        },
        price: '1.54',
        symbol: 'MATIC',
        time: '15 May 2024 9:00 am',
        type: 'Available',
        chain: 'stellar'
      })
    }
    arr1 = arr1.map((v, i) => {
      return {
        ...v,
        isHidden: arr1.length - 1 - i < sn
      };
    });

    console.log('window size: %s; num: %s; sn: %s; nftList.length: %s; num%: %s; arr1.len', w, num, sn, nftList.length, nftList.length % num, arr1.length)
    return arr1;
  }

  useEffect(() => {
    const key = showStellar ? stellarFilterArr.sort().join('-') : 'Polygon';
    setNftList(nftListData[key] ?? []);
    setShowPageLoading(false);
  }, [showStellar, stellarFilterArr, nftListData]);

  const filterList = useMemo(() => {
    const arr = nftList.filter(v => {
      const name = String(v.metadata.name).toLocaleLowerCase();
      const description = String(v.metadata.description).toLocaleLowerCase();
      const id = String(v.metadata.id);
      const txt = String(filterTxt).toLocaleLowerCase();
      return name.includes(txt) || description.includes(txt) || id.includes(txt);
    })
    return arr;
  }, [filterTxt, nftList]);

  const addStellarFilterItemFn = (type) => {
    setShowPageLoading(true);
    timer.current && clearInterval(timer.current);

    if (type === 'Available') {
      setStellarFilterArr(['Available']);
    } else {
      let arr = JSON.parse(JSON.stringify(stellarFilterArr));
      if (arr.findIndex(v => v === 'Available') > -1) {
        arr.splice(arr.findIndex(v => v === 'Available'), 1);
      }
      if (arr.includes(type)) {
        if (arr.length === 1) return;
        arr.splice(arr.findIndex(v => v === type), 1);
      } else {
        arr.push(type);
      }
      setStellarFilterArr(arr);
    }
  }

  useEffect(() => {
    time = setTimeout(async () => {
      const defaultArr = handleFitContentStyleFn(filterList);
      setHandlNftList(defaultArr);
    }, 0);
    return () => clearTimeout(time);
  }, [filterList]);

  window.onresize = () => {
    const defaultArr = handleFitContentStyleFn(filterList);
    setHandlNftList(defaultArr);
  };

  return (
    <Body>
      <FilterLine>
        <PolygonBtn onClick={() => {
          setShowPageLoading(true);
          setShowStellar(false);
          setFilterType('Polygon');
          setStellarFilterArr(['Available']);
        }} active={filterType}>Polygon</PolygonBtn>
        <StellarCon>
          <StellarBtn onClick={() => {
            setShowPageLoading(true);
            timer.current && clearInterval(timer.current);
            setShowStellar(true);
            setFilterType('Stellar');
            setStellarFilterArr(['Available']);
          }} active={filterType}>Stellar</StellarBtn>
          {
            filterType === 'Stellar' && (
              <StellarGroup>
                <StellarGroupItemBtn
                  active={String(stellarFilterArr.includes('Available'))}
                  onClick={() => addStellarFilterItemFn('Available')}
                >Available</StellarGroupItemBtn>
                <StellarGroupItemBtn
                  active={String(stellarFilterArr.includes('Listing'))}
                  onClick={() => addStellarFilterItemFn('Listing')}
                >Listing</StellarGroupItemBtn>
                <StellarGroupItemBtn
                  active={String(stellarFilterArr.includes('OnSale'))}
                  onClick={() => addStellarFilterItemFn('OnSale')}
                >On Sale</StellarGroupItemBtn>
                <StellarGroupItemBtn
                  active={String(stellarFilterArr.includes('Canceling'))}
                  onClick={() => addStellarFilterItemFn('Canceling')}
                >Canceling</StellarGroupItemBtn>
              </StellarGroup>
            )
          }
        </StellarCon>
      </FilterLine>

      <Spin spinning={showPageLoading}>
        <Con ref={itemDom}>
          {
            handleNftList.map((v, i) => (
              <MyAssetsItem 
                key={i}
                info={v}
                isStellar={showStellar}
              ></MyAssetsItem>
            ))
          }
        </Con>
      </Spin>
    </Body>
  )
};

export default MyAssetsContent;

const Body = styled.div`
  padding-bottom: 50px;
`;

const Con = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-content: flex-start;
  min-height: 460px;
`;

const FilterLine = styled.div`
  padding-top: 10px;
  display: flex;
  margin-bottom: 30px;
`;

const PolygonBtn = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  border: solid 1px ${(props) => props.active === 'Polygon' ? '#6271eb' : '#2b2e41'};
  margin-right: 16px;
  height: 48px;
  line-height: 48px;
  padding: 0 16px;
  font-family: PlusJakartaSans;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.active === 'Polygon' ? '#6271eb' : '#fff'};
`;

const StellarCon = styled.div`
  display: flex;
`; 

const StellarBtn = styled.div`
  font-family: PlusJakartaSans;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  border: solid 1px ${(props) => props.active === 'stellar' ? '#6271eb' : '#2b2e41'};
  color: ${(props) => props.active === 'stellar' ? '#6271eb' : '#fff'};
  cursor: pointer;
  height: 48px;
  line-height: 48px;
  padding: 0 16px;
  background-color: #1d1f2b;
  position: relavtive;
  z-index: 1;
`;

const StellarGroup = styled.div`
  padding-left: 94px;
  margin-left: -80px;
  border: solid 1px #2b2e41;
  border-radius: 14px;
  height: 48px;
  display: flex;
  align-items: center;
`;

const StellarGroupItemBtn = styled.div`
  padding: 0 13px;
  border-radius: 16px;
  height: 30px;
  line-height: 30px;
  border: solid 1px ${(props) => props.active === 'true' ? '#6271eb' : '#2b2e41'};
  color: ${(props) => props.active === 'true' ? '#6271eb' : '#fff'};
  cursor: pointer;
  margin-right: 12px;
`;