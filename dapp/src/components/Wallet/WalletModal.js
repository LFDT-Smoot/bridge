/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useContext } from "react";
import styled from 'styled-components';
import ModalBody from "../Modal";
import Icon from '@ant-design/icons';
import { ReactComponent as closeIcon } from 'images/close.svg';
import { ReactComponent as copyIcon } from 'images/copy.svg';
import metamask from 'images/metamask.webp';
import stellar from 'images/stellar.webp';
import { WalletContext } from "@/wallet/connect";
import { clipString2, copy } from "../../utils/utils";

const WalletModal = (props) => {
  const wallet = useContext(WalletContext);
  const connect = wallet.connect;
  const {
    visible,
    cancel
  } = props;

  const onConnect = (name) => {
    if (name === 'metamask') {
      if (wallet.polygonConnected) return;
    } else {
      if (wallet.stellarConnected) return;
    }
    connect(name);
    cancel();
  }

  return (
    <ModalBody
      visible={visible}
      cancel={cancel}
      size='s'
    >
      <Con>
        <TitleLine>
          <TitleTxt>Connect Wallet</TitleTxt>
          <CloseBtn component={closeIcon} onClick={cancel}></CloseBtn>
        </TitleLine>
        <BtnGroup>
          <Btn onClick={() => {
            onConnect('metamask');
          }}>
            <WalletImg src={metamask} alt='' />
            <WalletNameTxt>MetaMask</WalletNameTxt>
            { wallet.polygonConnected ? (
              <MetaMaskAddr>
                {clipString2(wallet.polygonAddress, 6, 4)}&nbsp;
                <CopyBtn onClick={() => copy(wallet.polygonAddress)} component={copyIcon}></CopyBtn>
              </MetaMaskAddr>
            ) : null }
          </Btn>
          <Btn onClick={() => {
            onConnect('stellar');
          }}>
            <WalletImg src={stellar} alt='' />
            <WalletNameTxt>Stellar Wallet</WalletNameTxt>
            { wallet.stellarConnected ? (
              <StellarAddr>
                {clipString2(wallet.stellarAddress, 6, 4)}&nbsp;
                <CopyBtn onClick={() => copy(wallet.stellarAddress)} component={copyIcon}></CopyBtn>
              </StellarAddr>
            ) : null }
          </Btn>
        </BtnGroup>
      </Con>
    </ModalBody>
  )
};

export default WalletModal;

const Con = styled.div`
  padding: 20px 20px 24px;
`;

const TitleLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TitleTxt = styled.p`
  font-family: PlusJakartaSans-Bold;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
`;

const CloseBtn = styled(Icon)`
  width: 40px;
  height: 40px;
  cursor: pointer;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const BtnGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Btn = styled.div`
  width: 204px;
  cursor: pointer;
  padding: 42px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: solid 2px #2b2e41;
  background: #2b2e41;
  border-radius: 16px;

  &:hover {
    border-color: #6271eb;
    background-color: rgba(98, 113, 235, 0.1);
  }
`;

const WalletImg = styled.img`
  width: 120px;
  height: 120px;
`;

const WalletNameTxt = styled.p`
  font-family: PlusJakartaSans-Bold;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
`;

const MetaMaskAddr = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  color: #f6851b;
`;

const StellarAddr = styled(MetaMaskAddr)`
  color: #fdda24;
`;

const CopyBtn = styled(Icon)`
  cursor: pointer;
  width: 12px;
  height: 12px;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;