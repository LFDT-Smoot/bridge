/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
function getCurTimestamp(toSecond = false) {
  let ts = new Date().getTime();
  if (toSecond) {
    ts = parseInt(ts / 1000);
  }
  return ts;
}

async function sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function hexStrip0x(hexStr) {
  if (0 == hexStr.indexOf('0x')) {
      return hexStr.slice(2);
  }
  return hexStr;
}

export {
  getCurTimestamp,
  sleep,
  hexStrip0x
}