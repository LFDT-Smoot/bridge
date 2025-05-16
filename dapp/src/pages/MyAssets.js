/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from "react";
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import MyAssetsContent from "../components/MyAssets/MyAssetsContent";
import MyAssetsTable from "../components/MyAssets/MyAssetsTable";
import searchIcon from 'images/searchIcon.png';
import stellarIcon from 'images/stellarIcon.png';
import polygonIcon from 'images/polygonIcon.png';

const MyAssets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filterChainStatus, setFilterChainStatus] = useState('');
  const [filterTxt, setFilterTxt] = useState('');

  const type = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('type');
    if (value) {
      return value;
    } else {
      return 'myAssets';
    }
  }, [location]);

  const [tabStatus, setTabStatus] = useState(type);

  return (
    <Body>
      <TabLine>
        <Tab>
          <TabBtn
            active={String(tabStatus === 'myAssets')}
            onClick={() => {
              setTabStatus('myAssets');
              navigate('/myAssets?type=myAssets');
            }}
          >My Assets</TabBtn>
          <TabBtn
            active={String(tabStatus === 'history')}
            onClick={() => {
              setTabStatus('history');
              navigate('/myAssets?type=history');
            }}
          >History</TabBtn>
        </Tab>
        <FilterLine>
          {
            tabStatus === 'history' && (
              <FilterChainCon>
                <FilterChainBtn
                  active={String(filterChainStatus === '')}
                  ml='12'
                  onClick={() => {
                    setFilterChainStatus('');
                  }}
                >ALL</FilterChainBtn>
                <FilterChainBtn
                  active={String(filterChainStatus === 'stellar')}
                  ml='12'
                  onClick={() => {
                    setFilterChainStatus('stellar');
                  }}
                >
                  <Img src={stellarIcon} alt='' />
                </FilterChainBtn>
                <FilterChainBtn
                  active={String(filterChainStatus === 'polygon')}
                  onClick={() => {
                    setFilterChainStatus('polygon');
                  }}
                >
                  <Img src={polygonIcon} alt='' />
                </FilterChainBtn>
              </FilterChainCon>
            )
          }
          <SearchCon>
            <SearchIcon src={searchIcon}></SearchIcon>
            <SearchInp placeholder='Search item' value={filterTxt} onChange={(e) => {
              setFilterTxt(e.target.value);
            }} />
          </SearchCon>
        </FilterLine>
      </TabLine>
      {
        tabStatus === 'myAssets' ? (
          <MyAssetsContent filterTxt={filterTxt}></MyAssetsContent>
        ) : (
          <MyAssetsTable
            filterChainStatus={filterChainStatus}
            filterTxt={filterTxt}
          ></MyAssetsTable>
        )
      }
    </Body>
  )
}

export default MyAssets;

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
  font-family: PlusJakartaSans;
  font-size: ${(props) => props.active === 'true' ? '54px' : '24px'};
  font-weight: bold;
  text-align: left;
  color: ${(props) => props.active === 'true' ? '#fff' : '#93989a'};
`;

const FilterLine = styled.div`
  display: flex;
`;

const FilterChainCon = styled.div`
  display: flex;
  border-radius: 10px;
  border: solid 1px #2b2e41;
`;

const FilterChainBtn = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: ${(props) => props.active === 'true' ? '#2b2e41' : 'none'};
  margin-right: ${(props) => props.ml ? props.ml : '0'}px;
  font-family: PlusJakartaSans;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
`;

const Img = styled.img`
  width: 32px;
  height: 32px;
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
  font-family: PlusJakartaSans;
  color: #fff;
  background: none;
  border: none;
  outline: none;

  &::placeholder {
    color: #93989a;
  }
`;