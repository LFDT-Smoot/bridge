/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import styled from 'styled-components';
import useSdk from '@/models/useSdk';
import useFormDataModal from "@/models/useFormData";
import polygonIcon from 'images/polygonIcon.png';
import stellarIcon from 'images/stellarIcon.png';

const MyAssetsTable = (props) => {
  const {
    filterChainStatus,
    filterTxt
  } = props;
  const { nftMarket, loading } = useSdk();
  const { data } = useFormDataModal();
  const [historyList, setHistoryList] = useState([]);
  let timer = useRef();

  const getHistoryList = async () => {
    try {
      const listLen = await nftMarket.getMyHistoryNumber(data.stellarAddress, data.polygonAddress);
      if (String(listLen) === '0') {
        console.log('my assets history num: 0');
        return;
      };
      let list = await nftMarket.getMyHistory(data.stellarAddress, data.polygonAddress, listLen, 0);
      console.log('history list', list)
      if (!list || !list.length) {
        console.log('nft list is null');
        return;
      };
      list = JSON.parse(JSON.stringify(list));
      const ids = list.map(v => v.nftId);
      const res = await nftMarket.getNftInfo(ids);
      const carr = list.map(v => {
        const nftData = res.find(item => v.nftId === item.id);
        if (!nftData) return null;
        let chainObj = { chain: '' };
        if (String(v.xlmAddr).toLocaleLowerCase() === String(data.stellarAddress).toLocaleLowerCase()) {
          chainObj.chain = 'Stellar';
        } else if (String(v.maticAddr).toLocaleLowerCase() === String(data.polygonAddress).toLocaleLowerCase()) {
          chainObj.chain = 'Polygon';
        } else {
          chainObj.chain = 'Stellar';
        }
        return Object.assign({}, v, nftData, chainObj);
      }).filter(v => !!v);
      
      console.log('get my assets result: %o  list: %o, ids: %o, stellarAddr: %s, polygonAddr: %s', res, carr, ids, data.stellarAddress, data.polygonAddress);
      setHistoryList(carr);
    } catch (e) {
      console.error('get market history list error', e);
    }
  };

  useEffect(() => {

    getHistoryList();

    timer.current = setInterval(() => {
      getHistoryList();
    }, 10000);

    return () => clearInterval(timer.current);
  }, [data.stellarAddress, data.polygonAddress, loading]);

  const filterList = useMemo(() => {
    let list = JSON.parse(JSON.stringify(historyList));
    list = list.filter(v => {
      return String(v.chain).toLocaleLowerCase().includes(String(filterChainStatus).toLocaleLowerCase());
    });
    list = list.filter(v => {
      return String(v.metadata.name).toLocaleLowerCase().includes(String(filterTxt).toLocaleLowerCase());
    });
    return list;
  }, [historyList, filterChainStatus, filterTxt]);

  return (
    <Body>
      <Thead>
        <Tr>
          <Th>Item</Th>
          <Th>BlockChain</Th>
          <Th>Card ID</Th>
          <Th>Price</Th>
          <Th>Time</Th>
        </Tr>
      </Thead>
      <Tbody>
        {
          filterList.map((item, index) => {
            return (
              <TrItem
                key={index}
              >
                <Td>
                  <NumTxt>{index + 1}</NumTxt>&nbsp;
                  <Img src={item.metadata.image} />&nbsp;
                  <Name>{item.metadata.name}</Name>
                </Td>
                <Td>
                  <BlockChainCon><ChainLogo src={item.chain === 'Polygon' ? polygonIcon : stellarIcon} />{item.chain}</BlockChainCon>
                </Td>
                <Td>
                  <Name>#{item.id}</Name>
                </Td>
                <Td>
                  <BlueTxt>{item.price}</BlueTxt>&nbsp;
                  {/* <SymbolTxt>{item.symbol}</SymbolTxt> */}
                  <SymbolTxt>MATIC</SymbolTxt>
                </Td>
                <Td>
                  <TimeTxt>
                    {
                      new Date(Number(item.chain === 'Polygon' ? item.timestamp : item.xlmCreateOrderTime)).toLocaleString('chinese', {
                        hour12: false,
                      })
                    } 
                  </TimeTxt>
                </Td>
              </TrItem>
            )
          })
        }
      </Tbody>
    </Body>
  )
};

export default MyAssetsTable;

const Body = styled.table`
  width: 100%;
  border-radius: 20px;
  background-color: #242634;
  margin-bottom: 50px;
`;

const Thead = styled.thead`
  height: 64px;
  padding: 0 16px;
  borer-bottom: 1px solid #1d1f2b;
`;

const Tbody = styled.tbody`
  padding: 0 16px;
`;

const Tr = styled.tr`
  padding: 0 16px;
  // display: flex;
  // width: 100%;
  // align-items: center;
  // height: 64px;
`;

const TrItem = styled(Tr)`
  height: 72px;
  line-height: 72px;
  cursor: pointer;

  &:hover {
    border-radius: 16px;
    background-color: #2b2e41;
  }
`;

const Th = styled.th`
  text-align: left;
    
  &:first-child {
    padding-left: 32px;
  }

  &:last-child {
    padding-right: 32px;
    text-align: right;
  }

  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #93989a;
`;

const Td = styled.td`
  text-align: left;

  &:first-child {
    padding-left: 24px;
  }

  &:last-child {
    padding-right: 24px;
    text-align: right;
  }
`;

const Img = styled.img`
  width: 60px;
  height: 48px;
  border-radius: 8px;
  margin-right: 12px;
  vertical-align: middle;
`;

const NumTxt = styled.p`
  width: 66px;
  text-align: center;
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #93989a;
  display: inline-block;
`;

const Name = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  display: inline-block;
`;

const BlueTxt = styled.span`
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #6271eb;
`;

const SymbolTxt = styled.span`
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #93989a;
`;

const TimeTxt = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #b7babc;
`;

const BlockChainCon = styled.div`
  display: flex;
  align-items: center;
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  color: #93989a;
`;

const ChainLogo = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
`;