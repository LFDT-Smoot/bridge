/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import styled from 'styled-components';

const Footer = () => {
  return (
    <Con>
      <Line></Line>
      <View>
        © NFT Market, Inc. All right reserved.
      </View>
    </Con>
  )
};

export default Footer;

const Con = styled.div`
  width: 100%;
  position: relative;
`;

const Line = styled.div`
  width: 100vw;
  height: 2px;
  background-color: #242634;
  position: absolute;
  top: 0;
  left: -100px;
  z-index: 0;
`;

const View = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  font-family: PlusJakartaSans;
  font-size: 14px;
  font-weight: 500;
  color: #93989a;
`;