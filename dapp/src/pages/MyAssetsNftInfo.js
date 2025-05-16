/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useContext } from "react";
import { WalletContext } from "@/wallet/connect";
import styled from 'styled-components';
import Icon from '@ant-design/icons';
import { ReactComponent as backIcon } from 'images/backIcon.svg';
import { ReactComponent as walletIcon } from 'images/wallet.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import MyAssetsSellModal from "../components/MyAssets/MyAssetsSellModal";
import MyAssetsSuccessfullyModal from '../components/MyAssets/MyAssetsSuccessfullyModal';
import useSdk from '@/models/useSdk';
import useFormDataModal from "@/models/useFormData";
import WalletModal from "../components/Wallet/WalletModal";
import btnLoading from 'images/btnLoading.png';
import { message } from 'antd';

const MyAssetsNftInfo = () => {
  const navigate = useNavigate();
  const { nftMarket } = useSdk();
  const wallet = useContext(WalletContext);
  const { modify, isValid, data } = useFormDataModal();
  const location = useLocation();
  const type = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('type');
    if (value) {
      return value;
    } else {
      return 'myAssets';
    }
  }, [location]);
  
  const [visible, setVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addr, setAddr] = useState('');
  const [price, setPrice] = useState('');
  const [showWalletModal, setWalletShowModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const info = data.nftInfo;

  if (isValid === false) {
    navigate('/myAssets?type=myAssets');
  }

  const unwrappedFn = async () => {
    // fromAccount: polygon address      toAccount: stellar address   wallet: polygon wallet

    try {
      await nftMarket.unwrap(info.wrappedId, addr, wallet.polygonAddress, wallet.polygonWallet);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoading(false);
      message.error(e.message);
      console.error(`${type} error: `, e);
    }
  };

  const sellFn = async () => {
    // fromAccount: stellar address      toAccount: polygon address   wallet: stellar wallet

    try {
      await nftMarket.createSellOrder(info.id, price, addr, wallet.stellarAddress, wallet.stellarProvider);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoading(false);
      message.error(e.message);
      console.error(`${type} error: `, e);
    }
  };

  const transferFn = async () => {
    try {
      await nftMarket.transferNft(info.id, addr, wallet.stellarAddress, wallet.stellarProvider);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoading(false);
      message.error(e.message);
      console.error(`${type} error: `, e);
    }
  }

  const cancelFn = async () => {
    try {
      await nftMarket.cancelSellOrder(info.xlmOrderKey, wallet.stellarAddress, wallet.stellarProvider);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoading(false);
      message.error(e.message);
      console.error(`${type} error: `, e);
    }
  };

  const confrmFn = () => {
    if (showLoading) return;

    setShowLoading(true);
    if (type !== 'Cancel' && !addr) {
      message.error('Invalid Address.');
      setShowLoading(false);
      return;
    }
    switch (type) {
      case 'Unwrap':
        unwrappedFn();
        break;
      case 'Sell':
        if (!price) {
          message.error('Invalid Amount.');
          setShowLoading(false);
          return;
        }
        setVisible(true);
        break;
      case 'Cancel':
        cancelFn();
        break;
      case 'Transfer':
        transferFn();
        break;
      default:
        return;
    }
  }

  const inpAddrFn = (e) => {
    const txt = e.target.value;
    const res = nftMarket.validateAddress('Stellar', txt);
    setAddr(txt);
    if (!res) {
      console.error('address error')
    }
  }

  const inpPriceFn = (e) => {
    const txt = e.target.value;
    setPrice(txt);
    modify({
      price: txt
    })
  }

  return (
    <Body>
      <BackBtn component={backIcon} onClick={() => {   
        navigate('/myAssets?type=myAssets');
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
              <TokenInfoLine>
                <NameCon>Card ID</NameCon>
                <CardIdTxt>#{info.id}</CardIdTxt>
              </TokenInfoLine>
              {
                type === 'Sell' && (
                  <>
                    <AddrTitle>Price</AddrTitle>
                    <InpAddrCon>
                      <InpAddr placeholder='Enter price' value={price} onChange={inpPriceFn} />
                      <PriceSymbolTxt>MATIC</PriceSymbolTxt>
                    </InpAddrCon>
                  </>
                )
              }
              {
                ['Sell', 'Unwrap', 'Transfer'].includes(type) ? (
                  <>
                    <AddrTitle>Recipient</AddrTitle>
                    <InpAddrCon>
                      {/* stellar address */}
                      <InpAddr placeholder='Enter address' value={addr} onChange={inpAddrFn} />
                      <WalletBtn component={walletIcon} onClick={() => {
                        if (type === 'Sell') {
                          if (wallet.polygonAddress) {
                            setAddr(wallet.polygonAddress);
                          } else {
                            setWalletShowModal(true);
                          }
                        } else {
                          // unwrap || transfer
                          if (wallet.stellarAddress) {
                            setAddr(wallet.stellarAddress);
                          } else {
                            setWalletShowModal(true);
                          }
                        }
                      }}></WalletBtn>
                    </InpAddrCon>
                  </>
                ) : null
              }
              {/* <FeeLine>
                <NameCon>Fee</NameCon>
                <PriceCon>
                  <PriceTxt>0</PriceTxt>&nbsp;
                  <PriceSymbolTxt>MATIC</PriceSymbolTxt>
                </PriceCon>
              </FeeLine> */}
              <BuyBtn onClick={confrmFn}>{showLoading ? (<BtnLoadingImg src={btnLoading} />) : type}</BuyBtn>
            </Information>
          </Content>
        ) : null
      }
      <MyAssetsSellModal
        visible={visible}
        cancel={() => {
          setVisible(false);
          setShowLoading(false);
        }}
        sellFn={() => {
          setVisible(false);
          sellFn()
        }}
      ></MyAssetsSellModal>

      {
        info && (
          <MyAssetsSuccessfullyModal
            visible={showSuccessModal}
            cancel={() => {
              setShowLoading(false);
              setShowSuccessModal(false);
              navigate('/myAssets?type=myAssets');
            }}
            size='xsm'
            type={type}
            name={info.metadata.name}
          ></MyAssetsSuccessfullyModal>
        )
      }

      <WalletModal
        visible={showWalletModal}
        cancel={() => setWalletShowModal(false)}
      ></WalletModal>
    </Body>
  )
};

export default MyAssetsNftInfo;

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
  font-family: PlusJakartaSans;
  font-size: 44px;
  font-weight: bold;
  color: #fff;
  padding: 20px 0;
`;

const NftDescription = styled.div`
  height: 116px;
  flex-grow: 0;
  font-family: PlusJakartaSans;
  font-size: 18px;
  color: rgba(147, 152, 154, 1);
  overflow-y: auto;
  margin-bottom: 22px;
`;

const TokenInfoLine = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 2px solid #2b2e41;
  border-bottom: 2px solid #2b2e41;
  margin-bottom: 16px;
  padding: 12px 0;
`;

const NameCon = styled.div`
  font-family: PlusJakartaSans;
  font-size: 18px;
  color: #b7babc;
`;

const CardIdTxt = styled.div`
  font-family: PlusJakartaSans;
  font-size: 18px;
  color: #96a0f2;
`;

const AddrTitle = styled.p`
  font-family: PlusJakartaSans;
  font-size: 18px;
  color: #fff;
  padding: 8px 0;
`;

const InpAddrCon = styled.div`
  padding: 18px 18px 18px 20px;
  border-radius: 15px;
  border: solid 1px #2b2e41;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InpAddr = styled.input`
  flex: 1;
  width: 0;
  font-size: 18px;
  font-family: PlusJakartaSans;
  color: #fff;
  background: none;
  border: none;
  outline: none;

  &::placeholder {
    color: rgba(147, 152, 154, 1);
  }
`;

const WalletBtn = styled(Icon)`
  width: 28px;
  height: 28px;
  cursor: pointer;
  
  svg {
    width: 28px;
    height: 28px;
  }
`;

// const FeeLine = styled.div`
//   padding: 24px 0;
//   display: flex;
//   justify-content: space-between;
// `;

// const PriceCon = styled.div`
//   display: flex;
// `;

// const PriceTxt = styled.p`
//   font-family: PlusJakartaSans;
//   font-size: 18px;
//   color: #fff;
// `;

const PriceSymbolTxt = styled.p`
  font-family: PlusJakartaSans;
  font-size: 18px;
  color: #93989a;
`;

const BuyBtn = styled.div`
  cursor: pointer;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background-color: #6271eb;
  font-family: PlusJakartaSans;
  font-size: 16px;
  color: #fff;
  margin-top: 20px;
`;

const BtnLoadingImg = styled.img`
  width: 20px;
  height: 20px;
`;