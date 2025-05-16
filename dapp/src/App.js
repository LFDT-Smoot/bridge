/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Routes, Route, BrowserRouter as Router, Navigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import Header from '@/components/Header';
import Market from './pages/Market'
import MarketNftInfo from './pages/MarketNftInfo';
import MyAssets from './pages/MyAssets';
import MyAssetsNftInfo from './pages/MyAssetsNftInfo';
import Wallet, { WalletContext } from './wallet/connect';
import { isMobile } from 'react-device-detect';
import Footer from '@/components/Footer';

const Body = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #1d1f2b;
`;

const Layout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0 100px;

  ${
    isMobile && css`
      width: 100%;
    `
  }
`;

const View = styled.div`
  flex: 1;
  overflow-y: auto;

  // &::-webkit-scrollbar{
  //   width: 12px;
  // }
  // &::-webkit-scrollbar-track{
  //   background: rgba(0, 0, 0, 0);
  //   border-radius: 10px;
  // }
  // &::-webkit-scrollbar-thumb{
  //   background: ${(props) => props.isdark === 'dark' ? '#062E4B' : '#FFF'};
  //   border-radius: 10px;
  // }
  // &::-webkit-scrollbar-thumb:hover{
  //   background: #333;
  // }
  // &::-webkit-scrollbar-corner{
  //   background: rgba(0, 0, 0, 0);
  // }

  ${
    isMobile && css`
      width: 100%;
    `
  }
`;

function App() {
  const [wallet, setWallet] = useState({});
  return (
    <Body>
      <Wallet wallet={wallet} setWallet={setWallet} />
      <WalletContext.Provider value={wallet}>
        <Router>
          <Layout>
            <Header></Header>
            <View>
              <Routes>
                <Route element={<Market />} path="/market"></Route>
                <Route element={<MarketNftInfo />} path="/market/nftInfo"></Route>
                <Route element={<MyAssets />} path="/myAssets"></Route>
                <Route element={<MyAssetsNftInfo />} path="/myAssets/nftInfo"></Route>
                <Route element={<Market />} path="/connect"></Route>
                <Route path="*" element={<Navigate to="/market" />} />
              </Routes>
            </View>
            <Footer></Footer>
          </Layout>
        </Router>
      </WalletContext.Provider>
    </Body>
  );
}

export default App;
