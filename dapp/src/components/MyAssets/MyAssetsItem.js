/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from "react";
import styled, { css } from 'styled-components';
// import Icon from '@ant-design/icons';
// import { ReactComponent as maticIcon } from 'images/matic.svg';
import { useNavigate } from 'react-router-dom';
import useFormDataModal from "@/models/useFormData";
import { hideTail } from "../../utils/utils";

const MyAssetsItem = (props) => {
  const {
    info,
    isStellar
  } = props;
  const navigate = useNavigate();
  const { modify } = useFormDataModal();
  const config = {
    available: 'Sell',
    normalTransfer: 'Transfer',
    listing: 'Cancel',
    wrapped: 'Unwrap',
    onsale: 'Cancel',
    canceling: 'Canceling'
  }
  const tagConfig = {
    available: 'Available',
    listing: 'Listing',
    wrapped: 'Wrapped',
    onsale: 'On Sale',
    canceling: 'Canceling'
  }
  const type = useMemo(() => {
    if (isStellar) {
      return info.status ? info.status : 'available';
    } else {
      return 'wrapped';
    }
  }, [isStellar, info.status]);
  const {
    name,
    description,
    image,
  } = info.metadata;

  const confirm = (type) => {
    modify({
      name: name,
      description: description,
      image: image,
      id: info.id,
      nftInfo: info
    })
    if (!String(type).includes('available')) {
      modify({
        price: info.price,
        // symbol: info.symbol
      })
    }
    navigate(`/myAssets/nftInfo?type=${config[type]}`)
  }

  return (
    <Body ishidden={String(info.isHidden)}>
      {
        info.isHidden ? (
          <Spin></Spin>
        ) : (
          <>
            <ImgCon>
              <Img src={image} alt='' />
              <TagCon type={tagConfig[type]}>{tagConfig[type]}</TagCon>
            </ImgCon>
            <NftInfo>
              <NftName>{hideTail(name, 22)}</NftName>
              <NftDescription>{hideTail(description, 34)}</NftDescription>
              {
                tagConfig[type] === 'Available' ? (
                  <BtnGroup>
                    <TransferBtn onClick={() => confirm('normalTransfer')}>Transfer</TransferBtn>
                    <SellBtn onClick={() => confirm(type)}>Sell</SellBtn>
                  </BtnGroup>
                ) : (
                  <BuyBtn onClick={() => confirm(type)} type={config[type]}>{config[type]}</BuyBtn>
                )
              }
            </NftInfo>
          </>
        )
      }
    </Body>
  )
};

export default MyAssetsItem;

const Body = styled.div`
  padding: 10px 10px 14px 10px;
  margin: 0;
  background: #242634;
  visibility: ${(props) => props.ishidden === 'true' ? 'hidden' : '' };
  margin-bottom: 30px;
  border-radius: 20px;
`;

const Spin = styled.div`
  width: 374px;
  height: 460px;
`;

const ImgCon = styled.div`
  width: 374px;
  height: 300px;
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
`;

const Img = styled.img`
  width: 374px;
  height: 300px;
  border-radius: 12px;
`;

const NftInfo = styled.div`
  padding: 0 14px;
`;

const NftName = styled.p`
  font-family: PlusJakartaSans-SemiBold;
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
  margin-bottom: 12px;
`;

const BtnGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SellBtn = styled.div`
  flex: 1;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: #6271eb;
  color: #fff;
`;

const TransferBtn = styled(SellBtn)`
  background: #9d4ebc;
  margin-right: 12px;
`;

const BuyBtn = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  ${
    (props) => props.type === 'Cancel' && css`
      background: #cbd0f8;
      color: #6271eb;
    `
  }

  ${
    (props) => props.type === 'Unwrap' && css`
      background: #6271eb;
      color: #fff;
    `
  }

  ${
    (props) => props.type === 'Canceling' && css`
      background: #20222e;
      color: #93989a;
    `
  }
`;

const TagCon = styled.div`
  height: 40px;
  padding: 0 12px;
  border-right: 4px solid #242634;
  border-bottom: 4px solid #242634;
  border-radius: 12px 0 12px 0;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  font-family: PlusJakartaSans-SemiBold;
  font-size: 16px;
  font-weight: 600;
  
  ${
    (props) => props.type === 'Available' && css`
      background: #6271eb;
      color: #fff;
    `
  }

  ${
    (props) => props.type === 'Canceling' && css`
      background: #2b2e41;
      color: #fff;
    `
  }

  ${
    (props) => props.type === 'Wrapped' && css`
      background: #6271eb;
      color: #fff;
    `
  }

  ${
    (props) => props.type === 'Listing' && css`
      background: #42a846;
      color: #fff;
    `
  }

  ${
    (props) => props.type === 'On Sale' && css`
      background: #fdda24;
      color: #000;
    `
  }
`;