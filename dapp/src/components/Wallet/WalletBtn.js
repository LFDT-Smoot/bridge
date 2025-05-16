/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useContext, useEffect } from "react";
import WalletModal from "../Wallet/WalletModal";
import styled from 'styled-components';
import { WalletContext } from "@/wallet/connect";
import polygonIcon from 'images/polygonIcon.png';
import { clipString } from '@/utils/utils';
import useFormDataModal from "@/models/useFormData";

const WalletBtn = () => {
  const wallet = useContext(WalletContext);
  const { modify } = useFormDataModal();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    modify(
      {
        polygonAddress: wallet.polygonAddress
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.polygonAddress]);

  useEffect(() => {
    modify(
      {
        stellarAddress: wallet.stellarAddress
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.stellarAddress]);

  return (
    <Body>
      <BtnGroup>
        {
          !wallet.polygonConnected && !wallet.stellarConnected ? (
            <ConnectWalletBtn onClick={() => setShowModal(true)}>Connect Wallet</ConnectWalletBtn>
          ) : (
            <>
              {
                wallet.polygonConnected ? (
                  <MetaMaskBtn onClick={() => setShowModal(true)}><WalletIcon src={wallet.getLogo('metamask')} />&nbsp;{clipString(wallet.polygonAddress, 12)}</MetaMaskBtn>
                ) : (
                  <WalletIcon mr='mr' src={polygonIcon} onClick={() => setShowModal(true)} />
                )
              }
              {
                wallet.stellarConnected ? (
                  <StellarBtn onClick={() => setShowModal(true)}><WalletIcon src={wallet.getLogo('stellar')} />&nbsp;{clipString(wallet.stellarAddress, 12)}</StellarBtn>
                ) : (
                  <WalletIcon src={polygonIcon} onClick={() => setShowModal(true)} />
                )
              }
            </>
          )
        }
      </BtnGroup>
      
      <WalletModal
        visible={showModal}
        cancel={() => setShowModal(false)}
      ></WalletModal>
    </Body>
  )
};

export default WalletBtn;

const Body = styled.div`
  display: flex;
`;

const ConnectWalletBtn = styled.div`
  padding: 14px 32px;
  cursor: pointer;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  border-radius: 10px;
  background-color: #6271eb;
`;

const BtnGroup = styled.div`
  display: flex;
  align-items: center;
`;

const MetaMaskBtn = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 10px;
  background-color: #2b2e41;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: #f6851b;
  margin-right: 8px;
  cursor: pointer;
`;

const StellarBtn = styled(MetaMaskBtn)`
  color: #fdda24;
`;

const WalletIcon = styled.img`
  width: 34px;
  height: 34px;
  cursor: pointer;
  margin-right: ${(props) => props.mr && '8px'};
`;