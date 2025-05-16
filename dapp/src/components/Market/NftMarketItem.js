/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import styled from 'styled-components';
import Icon from '@ant-design/icons';
import { ReactComponent as maticIcon } from 'images/matic.svg';
import { useNavigate } from 'react-router-dom';
import useFormDataModal from "@/models/useFormData";
import { hideTail } from "../../utils/utils";

const NftMarketItem = (props) => {
  const {
    isHidden,
    data
  } = props;
  const navigate = useNavigate();
  const { modify } = useFormDataModal();

  return (
    <>
      {
        isHidden ? (
          <HiddenBody></HiddenBody>
        ) : (
          <Body isHidden={isHidden}>
            <Img src={data.metadata.image} alt='' />
            <NftInfo>
              <NftName>{hideTail(data.metadata.name, 22)}</NftName>
              <NftDescription>{hideTail(data.metadata.description, 34)}</NftDescription>
              <FunctionalDomain>
                <NftPriceCon>
                  <NftPriceTitle>Price</NftPriceTitle>
                  <NftPrice>
                    <MaticIcon component={maticIcon}></MaticIcon>
                    {hideTail(data.price, 10)}&nbsp;MATIC
                  </NftPrice>
                </NftPriceCon>
                <BuyBtn status={data.status} onClick={() => {
                  if (data.status === 'listing') return;
                  modify({
                    name: data.metadata.name,
                    description: data.metadata.description,
                    price: data.price,
                    nftInfo: data
                  })
                  navigate(`/market/nftInfo`);
                }}>Buy</BuyBtn>
              </FunctionalDomain>
            </NftInfo>
          </Body>
        )
      }
    </>
  )
};

export default NftMarketItem;

const HiddenBody = styled.div`
  width: 394px;
  height: 496px;
  visibility: hidden;
`;

const Body = styled.div`
  padding: 10px 10px 14px 10px;
  margin: 0;
  background: #242634;
  visibility: ${(props) => props.isHidden === 'true' ? 'hidden' : '' };
  margin-bottom: 30px;
  border-radius: 20px;
`;

const Img = styled.img`
  width: 374px;
  height: 300px;
  border-radius: 12px;
  margin-bottom: 24px;
`;

const NftInfo = styled.div`
  padding: 0 14px;
`;

const NftName = styled.p`
  font-family: PlusJakartaSans-Bold;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
`;

const NftDescription = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 18px;
  font-weight: 500;
  color: #93989a;
  margin-bottom: 22px;
`;

const FunctionalDomain = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NftPriceCon = styled.div``;

const NftPriceTitle = styled.p`
  font-family: PlusJakartaSans-Medium;
  font-size: 14px;
  font-weight: 500;
  color: #93989a;
  margin-bottom: 4px;
`;

const NftPrice = styled.div`
  display: flex;
  align-items: center;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const MaticIcon = styled(Icon)`
  width: 22px;
  height: 21px;
  margin-right: 6px;

  svg {
    width: 22px;
    height: 21px;
  }
`;

const BuyBtn = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 54px;
  border-radius: 12px;
  background-color: ${(props) => props.status === 'listing' ? '#20222e' : '#6271eb'};
  font-family: PlusJakartaSans-SemiBold;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.status === 'listing' ? '#93989a' : '#fff'};
  cursor: ${(props) => props.status === 'listing' ? 'not-allowed' : 'pointer'};
`;