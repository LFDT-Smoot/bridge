/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import styled from 'styled-components';
import Icon from '@ant-design/icons';
import { ReactComponent as closeIcon } from 'images/close.svg';
import ModalBody from "../Modal";
import useFormDataModal from "@/models/useFormData";

const MyAssetsSellModal = (props) => {
  let {
    visible,
    cancel,
    sellFn
  } = props;
  const { data } = useFormDataModal();

  return (
    <ModalBody
      visible={visible}
      cancel={cancel}
      size='xsm'
    >
      <Con>
        <Title>
          <TitleTxt>Confirmation</TitleTxt>
          <CloseBtn component={closeIcon} onClick={cancel}></CloseBtn>
        </Title>
        <NftInfoCon>
          <Img src={data.image} alt />
          <NftInfo>
            <NftName>{data.name}</NftName>
            <NftDescription>{data.description}</NftDescription>
          </NftInfo>
        </NftInfoCon>
        <TokenInfoLine>
          <NameCon>Card ID</NameCon>
          <CardIdTxt>{data.id}</CardIdTxt>
        </TokenInfoLine>
        <PriceTitle>Price</PriceTitle>
        <PriceCon>
          <PriceTxt>{data.price}</PriceTxt>
          <PriceSymbolTxt>{data.symbol}</PriceSymbolTxt>
        </PriceCon>
        {/* <FeeLine>
          <PriceSymbolTxt>Fee</PriceSymbolTxt>
          <FeeValue>
            <FeeTxt>0</FeeTxt>&nbsp;
            <PriceSymbolTxt>{data.symbol}</PriceSymbolTxt>
          </FeeValue>
        </FeeLine>
        <FeeLine>
          <PriceSymbolTxt>Total</PriceSymbolTxt>
          <FeeValue>
            <FeeTxt>0</FeeTxt>&nbsp;
            <PriceSymbolTxt>{data.symbol}</PriceSymbolTxt>
          </FeeValue>
        </FeeLine> */}
        <BuyBtn onClick={() => sellFn()}>Sell</BuyBtn>
      </Con>
    </ModalBody>
  )
};

export default MyAssetsSellModal;

const Con = styled.div`
  padding: 24px 36px;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TitleTxt = styled.p`
  font-size: 24px;
  color: #fff;
  font-family: PlusJakartaSans-Bold;
  font-weight: bold;
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

const NftInfoCon = styled.div`
  display: flex;
  margin-bottom: 14px;
`;

const Img = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 12px;
  margin-right: 12px;
`;

const NftInfo = styled.div`
  flex: 1;
`;

const NftName = styled.p`
  padding: 12px 0 8px 0;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const NftDescription = styled.p`
  max-height: 44px;
  font-family: PlusJakartaSans-Regular;
  font-size: 14px;
  color: #b7babc;
  overflow-y: auto;
`;

const TokenInfoLine = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 2px solid #2b2e41;
  border-bottom: 2px solid #2b2e41;
  margin-bottom: 16px;
  padding: 8px 0;
`;

const NameCon = styled.div`
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #b7babc;
`;

const CardIdTxt = styled.div`
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #96a0f2;
`;

const PriceTitle = styled.div`
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #fff;
  margin-bottom: 8px;
`;

const PriceCon = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 18px 20px;
  border-radius: 15px;
  background-color: #20222e;
  margin-bottom: 18px;
`;

const PriceTxt = styled.p`
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #fff;
`;

const PriceSymbolTxt = styled.p`
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #93989a;
`;

// const FeeLine = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 6px 0;
// `;

// const FeeValue = styled.div`
//   display: flex;
//   align-items: center;
// `;

// const FeeTxt = styled.p`
//   font-family: PlusJakartaSans;
//   font-size: 18px;
//   color: #6271eb;
// `;

const BuyBtn = styled.div`
  height: 50px;
  cursor: pointer;
  border-radius: 15px;
  background-color: #6271eb;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 18px;
`;