/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { message } from 'antd';
import BigNumber from 'bignumber.js';
import copy2Clipboard from 'copy-to-clipboard';
import numeral from 'numeral';

export const visitV1Fn = (network) => {
  window.location.href = `${network === 'mainnet' ? 'https://bridge-v1.wanchain.org '  : 'https://bridge-testnet-v1.wanchain.org'}`;
}

export const isEvmWallet = (wallet) => {
  return wallet.type === 'evm';
}

export const parseFee = (fee, amount, type, original) => {
  let result = new BigNumber(0),
    networkFee = new BigNumber(0),
    decimals = 0,
    tmp;
  if (fee.networkFee.discount === void 0) fee.networkFee.discount = 1;
  if (fee.operateFee.discount === void 0) fee.operateFee.discount = 1;
  if ('networkFee' === type) {
    tmp = new BigNumber(fee.networkFee.value);
    if (tmp.gt(0) && fee.networkFee.isRatio) {
      tmp = tmp.times(amount);
      if (Number(fee.networkFee.min) !== 0 && tmp.lt(fee.networkFee.min)) {
        tmp = fee.networkFee.min;
      } else if (Number(fee.networkFee.max) !== 0 && tmp.gt(fee.networkFee.max)) {
        tmp = fee.networkFee.max;
      }
    }
    if (!original) {
      tmp = new BigNumber(tmp).times(fee.networkFee.discount);
    }
    if (
      fee.networkFee.isSubsidy &&
      new BigNumber(fee.networkFee.subsidyBalance).gte(tmp)
    )
      tmp = 0;
    networkFee = tmp;
    result = result.plus(networkFee);
    decimals = fee.networkFee.decimals;
  }
  if ('operateFee' === type) {
    tmp = new BigNumber(fee.operateFee.value);
    if (tmp.gt(0) && fee.operateFee.isRatio) {
      tmp = tmp.times(new BigNumber(amount).minus(networkFee));
      if (Number(fee.operateFee.min) !== 0 && tmp.lt(fee.operateFee.min)) {
        tmp = fee.operateFee.min;
      } else if (Number(fee.operateFee.max) !== 0 && tmp.gt(fee.operateFee.max)) {
        tmp = fee.operateFee.max;
      }
    }
    if (!original) {
      tmp = new BigNumber(tmp).times(fee.operateFee.discount);
    }
    result = result.plus(tmp);
    decimals = fee.operateFee.decimals;
  }

  return new BigNumber(result.toFixed(decimals)).toFixed();
};

export const formatParseFee = (fee, data, original = true) => {
  let parseFeeResult;
  const networkFeeResult = parseFee(fee, data.amount, 'networkFee', original);
  const operateFeeResult = parseFee(fee, data.amount, 'operateFee', original);
  const showPrice = !(
    (!fee.networkFee.price && !new BigNumber(networkFeeResult).eq(0)) ||
    (!fee.operateFee.price && !new BigNumber(operateFeeResult).eq(0))
  );
  const networkPrice = new BigNumber(networkFeeResult).times(
    fee.networkFee.price || 0,
  );
  const operatePrice = new BigNumber(operateFeeResult).times(
    fee.operateFee.price || 0,
  );
  parseFeeResult = {
    networkFee: networkFeeResult,
    operateFee: operateFeeResult,
    totalFee: new BigNumber(networkFeeResult).plus(operateFeeResult).toFixed(),
    isRequireSubsidyModal:
      fee.networkFee.isSubsidy &&
      new BigNumber(fee.networkFee.subsidyBalance).lt(networkFeeResult),
    price: showPrice ? networkPrice.plus(operatePrice).toFixed(3) : null,
  };

  return parseFeeResult;
};

export const convertStr2Hex_custom = (str = '') => {
  let hex = '';
  str = str || '';
  str.split('').forEach((c) => {
    hex += c.charCodeAt();
  });
  if (hex.length < 16) {
    hex = hex.padStart(16, '0');
  }
  return hex;
};

export const checkNumber = (num) => {
  const reg1 = /^[0-9]+$/;
  const reg2 = /^[0-9]+\.[0-9]+$/;
  return reg1.test(num) || reg2.test(num);
};

export const clipString = (str, len) => {
  if (typeof str !== 'string' || typeof len !== 'number') return str;
  if (str.length <= len) return str;
  let text = '';
  let preLen = parseInt(len / 2);
  let sufLen = len - preLen;
  text = str.substr(0, preLen + 2) + '...' + str.substr(-sufLen);
  return text;
};

export const clipString2 = (str, preLen, sufLen) => {
  if (
    typeof str !== 'string' ||
    typeof preLen !== 'number' ||
    typeof sufLen !== 'number' ||
    preLen < 1 ||
    sufLen < 1
  )
    return str;
  if (str.length <= preLen + sufLen) return str;
  let text = '';
  text = str.substr(0, preLen) + '...' + str.substr(-sufLen);
  return text;
};

export const clipString3 = (str, len) => {
  if (typeof str !== 'string' || typeof len !== 'number') return str;
  if (str.length <= len) return str;
  let text = '';
  let preLen = parseInt(len / 2);
  let sufLen = len - preLen;
  text = str.substr(0, preLen + 2) + '...' + str.substr(5-sufLen);
  return text;
};

export const hideTail = (str, len) => {
  if (typeof str !== 'string' || typeof len !== 'number') return str;
  if (str.length <= len) return str;
  let text = '';
  let preLen = parseInt(len / 2);
  text = str.substr(0, preLen) + '...';
  return text;
};

export const hideTail2 = (str, len) => {
  if (typeof str !== 'string' || typeof len !== 'number' || len < 2) return str;
  if (str.length <= len) return str;
  let text = '';
  let preLen = len - 2;
  text = str.substr(0, preLen) + '...';
  return text;
};

export const copy = (text, t) => {
  if (copy2Clipboard(text)) {
    message.success('Copied');
  } else {
    message.warning('Failed to copy');
  }
};

export function commafy(num, fixed = null, is_decimal = true) {
  if (!num) {
    return '--';
  }

  num = num.toString();

  if (!num.includes('.')) {
    if (is_decimal) {
      num += '.0';
    }
  } else {
    if (fixed != null) {
      num = Number(num).toFixed(fixed);
    } else {
      if (num.indexOf('.') > 3) {
        num = Number(num).toFixed(1);
      } else if (num.length > 5) {
        num = Number(num).toFixed(4);
      }
    }
  }

  // return num.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
  //   return $1 + ',';
  // });
  return numeral(num).format('0,0.0');
}

export function commafy2(num, decimal = 0, strLen = 6) {
  if (!num) return '--';
  num = String(num);
  if (decimal) {
    decimal = Number(decimal);
    if (isNaN(decimal)) decimal = 0;
  }
  let finnalNum;
  if (!num.includes('.')) {
    finnalNum = new BigNumber(num).toFormat();
  } else {
    const numFix8Decimal = new BigNumber(num).toFixed(decimal);
    if (numFix8Decimal.length > strLen) {
      const IntNum = numFix8Decimal.split('.')[0];
      if (IntNum.length > strLen) {
        finnalNum = IntNum;
      } else {
        finnalNum = numFix8Decimal.slice(0, strLen);
      }
    } else {
      finnalNum = numFix8Decimal;
    }
    finnalNum = new BigNumber(finnalNum).toFormat();
  }
  return finnalNum;
}

export function commafy3(num, name) {
  if (Number(num) === 0) return '0';
  if (!num) return '--';
  num = String(num);
  let finnalNum;
  if (!num.includes('.')) {
    finnalNum = new BigNumber(num).toFormat();
  } else {
    const numBigNum = new BigNumber(num);
    let strLen = 4;
    if (numBigNum.lt(0.000001)) return '0';
    if (['BTC.a', 'wanBTC'].includes(name)) name = 'BTC';
    if (['USDC.e'].includes(name)) name = 'USDC';
    if (['btc', 'eth'].includes(String(name).toLocaleLowerCase())) {
      strLen = 6;
    }
    // handle dollar price
    if (name === 'price') {
      strLen = 2;
    }
    const num1 = num.split('.')[0];
    let num2 = num.split('.')[1];
    if (num2.length > strLen) {
      num2 = num2.slice(0, strLen);
    }
    finnalNum = num1 + '.' + num2;
    finnalNum = new BigNumber(finnalNum).toFormat();
  }
  return finnalNum;
}

export function commafy4(num) {
  if (Number(num) === 0) return '0';
  if (!num) return '--';
  num = String(num);
  let finnalNum;
  if (!num.includes('.')) {
    finnalNum = new BigNumber(num).toFormat();
  } else {
    let strLen = 3;
    const num1 = num.split('.')[0];
    let num2 = num.split('.')[1];
    const num2Str = String(Number(num2));
    const len = num2.length - num2Str.length;
    num2 = num2Str.slice(0, strLen);
    for (let i = 0; i < len; i ++) {
      num2 = '0' + num2;
    }
    finnalNum = num1 + '.' + num2;
    finnalNum = new BigNumber(finnalNum).toFormat();
  }
  return finnalNum;
}
