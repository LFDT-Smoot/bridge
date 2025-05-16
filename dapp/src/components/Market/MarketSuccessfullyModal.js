/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import styled from 'styled-components';
import successImg from 'images/success.png';
import ModalBody from "../Modal";

const MarketSuccessfullyModal = (props) => {
  let {
    visible,
    cancel,
    name
  } = props;
  return (
    <ModalBody
      visible={visible}
      cancel={cancel}
      size='xsm'
    >
      <Con>
        <Logo>
          <SuccessIcon src={successImg}></SuccessIcon>
        </Logo>
        <Title>Successfully</Title>
        <Description>You have successfully purchased&nbsp;<LightTxt>{name}</LightTxt>
        {/* &nbsp;initiated by&nbsp;<LightTxt>Angelina Christy</LightTxt> */}
        .</Description>
        <BuyBtn onClick={() => {
          cancel();
        }}>Confirm</BuyBtn>
      </Con>
    </ModalBody>
  )
};

export default MarketSuccessfullyModal;

const Con = styled.div`
  padding: 36px;
`;

const Logo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 110px;
  height: 110px;
  margin: 0 auto 30px;
  border-radius: 100%;
`;

const SuccessIcon = styled.img`
  width: 110px;
  height: 110px;
`;

const Title = styled.div`
  text-align: center;
  margin-bottom: 16px;
  font-family: PlusJakartaSans-Bold;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
`;

const Description = styled.p`
  margin-bottom: 30px;
  color: #6271eb;
  font-family: PlusJakartaSans-Regular;
  font-size: 18px;
  color: #93989a;
  text-align: center;
`;

const LightTxt = styled.span`
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
  font-family: PlusJakartaSans-SemiBold;
`;

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