/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useRef } from 'react';
import styled, { css } from 'styled-components';
import { Modal } from 'antd';
import './index.scss';
// import { isMobile } from 'react-device-detect';

const Con = styled.div`
  background-color: #242634;
  border-radius: 12px;
  transform-origin: 0 0;

  ${
    (props) => props.size === 'xxl' && css`
      width: 1520px;
      max-width: 1520px;
    `
  }

  ${
    (props) => props.size === 'l' && css`
      width: 892px;
      max-width: 892px;
    `
  }

  ${
    (props) => props.size === 'm' && css`
      width: 686px;
      max-width: 686px;
    `
  }

  ${
    (props) => props.size === 'sm' && css`
      width: 550px;
      max-width: 550px;
    `
  }

  ${
    (props) => props.size === 'xsm' && css`
      width: 500px;
      max-width: 500px;
    `
  }

  ${
    (props) => props.size === 's' && css`
      width: 480px;
      max-width: 480px;
    `
  }

  ${
    (props) => props.size === 'xs' && css`
      width: 448px;
      max-width: 448px;
    `
  }
`;

const width = {
  xs: '448px',
  s: '480px',
  xsm: '500px',
  sm: '550px',
  m: '686px',
  l: '892px',
  xxl: '1520px'
}

const ModalBody = (props) => {
  const { size, children, cancel, visible } = props;
  const conRef = useRef(null);

  return (
    <Modal
      open={visible}
      // centered={isMobile ? false : true}
      centered={true}
      onCancel={cancel}
      closeIcon={false}
      footer={null}
      // width={isMobile ? '100%' : width[size]}
      // wrapClassName={isMobile && 'react-modal-design'}
      width={ width[size]}
    >
      <Con
        ref={conRef}
        // size={isMobile ? '100%' : size ? size : 'm'}
        size={size ? size : 'm'}
      >
        {children}
      </Con>
    </Modal>
  );
};

export default ModalBody;
