/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useContext, useEffect } from "react";
import styled from 'styled-components';
import { WalletContext } from "@/wallet/connect";
import Icon from '@ant-design/icons';
import { ReactComponent as backIcon } from 'images/backIcon.svg';
import { ReactComponent as maticIcon } from 'images/matic.svg';
import { useNavigate } from 'react-router-dom';
import MarketBuyModal from "../components/Market/MarketBuyModal";
import MarketSuccessfullyModal from '../components/Market/MarketSuccessfullyModal';
import useSdk from '@/models/useSdk';
import useFormDataModal from "@/models/useFormData";
import WalletModal from "../components/Wallet/WalletModal";
import btnLoading from 'images/btnLoading.png';
import { message } from 'antd';

const MarketNftInfo = () => {
  const navigate = useNavigate();
  const { nftMarket } = useSdk();
  const wallet = useContext(WalletContext);
  const { modify, resetNftInfo, isValid, data } = useFormDataModal();
  const [visible, setVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWalletModal, setWalletShowModal] = useState(false);
  const [fee, setFee] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  if (isValid === false) {
    navigate('/market?type=market');
  }

  const info = data.nftInfo;

  const buyFn = async () => {
    try {
      await nftMarket.buy(info.maticOrderKey, wallet.polygonAddress, wallet.polygonWallet);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoading(false);
      message.error(e.message);
      console.error('buy error: ', e);
    }
  }

  useEffect(() => {
    const getFeeFn = async () => {
      try {
        // from polygon to stellar
        const fee = await nftMarket.getWmbFee('Polygon', 'Stellar');
        modify({
          fee: fee
        })
        setFee(fee);
      } catch (e) {
        console.error('get fee error', e);
      }
    }
    getFeeFn();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftMarket]);
  return (
    <Body>
      <BackBtn component={backIcon} onClick={() => {
        navigate('/market?type=market');
        resetNftInfo();
      }}></BackBtn>
      {
        info ? (
          <Content>
            <NftImg src={info.metadata.image} alt />
            <Information>
              <NftName>{info.metadata.name}</NftName>
              <NftDescription>
                {info.metadata.description}
              </NftDescription>
              <NftInfo>
                <NftInfoItem>
                  <NftInfoItemTitle>Price</NftInfoItemTitle>
                  <NftInfoItemValue>
                    <MaticIcon component={maticIcon}></MaticIcon>{info.price}&nbsp;
                    {/* {info.symbol} */}MATIC
                  </NftInfoItemValue>
                </NftInfoItem>
                <NftInfoItem>
                  <NftInfoItemTitle>Card ID</NftInfoItemTitle>
                  <NftInfoItemValue>{info.id}</NftInfoItemValue>
                </NftInfoItem>
              </NftInfo>
              <BuyBtn onClick={() => {
                if (!wallet.polygonConnected) {
                  setWalletShowModal(true);
                  return;
                }
                if (showLoading) return;
                setVisible(true);
              }}>{wallet.polygonConnected ? showLoading ? (
                <BtnLoadingImg src={btnLoading} />
              ) : 'Buy' : 'Connect Wallet'}</BuyBtn>
            </Information>
          </Content>
        ) : null
      }
      <MarketBuyModal
        visible={visible}
        cancel={() => setVisible(false)}
        buyFn={() => {
          setShowLoading(true);
          setVisible(false);
          buyFn();
        }}
        info={info}
        fee={fee}
      ></MarketBuyModal>

      <MarketSuccessfullyModal
        visible={showSuccessModal}
        cancel={() => {
          setShowSuccessModal(false);
          setShowLoading(false);
          navigate('/market?type=market');
        }}
        size='xsm'
        name={info.metadata.name}
      ></MarketSuccessfullyModal>

      <WalletModal
        visible={showWalletModal}
        cancel={() => setWalletShowModal(false)}
      ></WalletModal>
    </Body>
  )
};

export default MarketNftInfo;

const Body = styled.div`
  padding: 44px 0 50px;
`;

const BackBtn = styled(Icon)`
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin-bottom: 16px;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const Content = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NftImg = styled.img`
  width: 620px;
  height: 550px;
  border-radius: 16px;
  margin-right: 44px;
`;

const Information = styled.div`
  // width: 578px;
  flex: 1;
`;

const NftName = styled.p`
  font-family: PlusJakartaSans-Bold;
  font-size: 44px;
  font-weight: bold;
  color: #fff;
  padding: 20px 0;
`;

const NftDescription = styled.div`
  height: 260px;
  flex-grow: 0;
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: rgba(147, 152, 154, 1);
  overflow-y: auto;
  margin-bottom: 48px;
`;

const NftInfo = styled.div`
  display: flex;
  margin-bottom: 28px;
`;

const NftInfoItem = styled.div`
  margin-right: 80px;
`;

const NftInfoItemTitle = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.16px;
  color: rgba(147, 152, 154, 1);
  margin-bottom: 15px;
`;

const NftInfoItemValue = styled.div`
  display: flex;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  align-items: center;
`;

const MaticIcon = styled(Icon)`
  width: 25px;
  height: 24px;
  margin-right: 12px;

  svg {
    width: 25px;
    height: 24px;
  }
`;

const BuyBtn = styled.div`
  cursor: pointer;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background-color: #6271eb;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 16px;
  color: #fff;
`;

const BtnLoadingImg = styled.img`
  width: 20px;
  height: 20px;
`;