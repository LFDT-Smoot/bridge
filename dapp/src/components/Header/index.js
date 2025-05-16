/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from "react";
import styled, { keyframes } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from 'images/logo.webp';
import WalletBtn from "../Wallet/WalletBtn";

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(pathname.includes('market') ? 'market' : 'assets');

  useEffect(() => {
    setActive(pathname.includes('market') ? 'market' : 'assets');
  }, [pathname]);

  return (
    <Con>
      <Line></Line>
      <LeftCon>
        <Logo src={logo} />
        NFT Market
        <TabCon>
          <Btn onClick={() => {
            setActive('market');
            navigate('/market?type=market');
          }} active={String(active === 'market')}>
            Market
            <BtnActiveCon>
              {
                active === 'market' ? (
                  <BtnActive></BtnActive>
                ) : (
                  <BtnNormal></BtnNormal>
                )
              }
            </BtnActiveCon>
          </Btn>
          <Btn onClick={() => {
            setActive('assets');
            navigate('/myAssets?type=myAssets');
          }} active={String(active === 'assets')}>
            My Assets
            <BtnActiveCon>
              {
                active === 'assets' ? (
                  <BtnActive></BtnActive>
                ) : (
                  <BtnNormal></BtnNormal>
                )
              }
            </BtnActiveCon>
          </Btn>
        </TabCon>
      </LeftCon>
      <RightCon>
        <WalletBtn></WalletBtn>
      </RightCon>
    </Con>
  )
};

export default Header;

const Con = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
`;

const Line = styled.div`
  width: 100vw;
  height: 2px;
  background-color: #242634;
  position: absolute;
  bottom: 0;
  left: -100px;
  z-index: 0;
`;

const LeftCon = styled.div`
  display: flex;
  align-items: center;
  padding: 30px 0;
  font-family: PlusJakartaSans-Medium;
  font-size: 20px;
  font-weight: 500;
  color: #fff;
  height: 100%;
`;

const Logo = styled.img`
  width: 42px;
  height: 42px;
  margin-right: 14px;
`;

const RightCon = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  height: 100%;
`;

const TabCon = styled.div`
  display: flex;
  height: 100%;
`;

const Btn = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 60px;
  width: fit-content;
  height: 100%;
`;

const BtnActiveCon = styled.div`
  width: 100%;
  height: 2px;
  position: absolute;
  bottom: 0;
  left: 0;
`;

const Animation = keyframes`
  0% { width: 0; }
  100% { width: 100%; }
`;

const CloseAnimation = keyframes`
  0% { width: 100%; }
  100% { width: 0; }
`;

const BtnActive = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  background: #fff;
  transform: translateX(-50%);
  animation: 0.3s ${Animation};
  height: 2px;
  width: 100%;
`;

const BtnNormal = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  background: #fff;
  transform: translateX(-50%);
  animation: 0.3s ${CloseAnimation};
  height: 2px;
  width: 0;
`;