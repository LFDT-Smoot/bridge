/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from "react";
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import MarketContent from "../components/Market/MarketContent";
import MarketTable from "../components/Market/MarketTable";
import searchIcon from 'images/searchIcon.png';

const Market = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const type = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('type');
    if (value) {
      return value;
    } else {
      return 'market';
    }
  }, [location]);

  const [tabStatus, setTabStatus] = useState(type);
  const [filterTxt, setFilterTxt] = useState('');

  return (
    <Body>
      <TabLine>
        <Tab>
          <TabBtn
            active={String(tabStatus === 'market')}
            onClick={() => {
              setTabStatus('market');
              navigate('/market?type=market');
            }}
          >Market</TabBtn>
          <TabBtn
            active={String(tabStatus === 'history')}
            onClick={() => {
              setTabStatus('history');
              navigate('/market?type=history');
            }}
          >History</TabBtn>
        </Tab>
        <SearchCon>
          <SearchIcon src={searchIcon}></SearchIcon>
          <SearchInp placeholder='Search item' value={filterTxt} onChange={(e) => {
            setFilterTxt(e.target.value);
          }} />
        </SearchCon>
      </TabLine>
      {
        tabStatus === 'market' ? (
          <MarketContent filterTxt={filterTxt}></MarketContent>
        ) : (
          <MarketTable filterTxt={filterTxt}></MarketTable>
        )
      }
    </Body>
  )
}

export default Market;

const Body = styled.div`
  padding-top: 70px;
`;

const TabLine = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Tab = styled.div`
  display: flex;
  align-items: flex-end;
`;

const TabBtn = styled.div`
  cursor: pointer;
  margin-right: 40px;
  font-family: PlusJakartaSans-Bold;
  font-size: ${(props) => props.active === 'true' ? '54px' : '24px'};
  font-weight: bold;
  text-align: left;
  color: ${(props) => props.active === 'true' ? '#fff' : '#93989a'};
`;

const SearchCon = styled.div`
  width: 290px;
  height: 50px;
  border: 1px solid #2b2e41;
  display: flex;
  align-items: center;
  margin-left: 16px;
  padding: 0 16px;
  border-radius: 14px;
`;

const SearchIcon = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 10px;
`;

const SearchInp = styled.input`
  flex: 1;
  width: 0;
  font-size: 16px;
  font-family: PlusJakartaSans-Regular;
  color: #fff;
  background: none;
  border: none;
  outline: none;

  &::placeholder {
    color: #93989a;
  }
`;
