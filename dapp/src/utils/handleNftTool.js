/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import Identicon from 'identicon.js';
import BigNumber from 'bignumber.js';
import axios from "axios";

const resServer = axios.create({
  timeout: 5000,
});

export async function getNftsImageData (ids, sdkFn) {
  const result = await Promise.all(
    ids.map(async (item) => {
      try {
        const data = await sdkFn(item);
        return Promise.resolve({ data });
      } catch (e) {
        console.error('get cardId %s nft info error: %o', item, e);
        return Promise.resolve(null);
      }
    }),
  );
  return result;
}

function handleUriFn (uri) {
  let url = String(uri).replace(/ipfs:\/\//, 'https://ipfs.io/ipfs/');
  let reqData = {};
  if (url.includes('?')) {
    let arr = url.split('?');
    url = arr[0];
    const arr1 = arr[1].split('&');
    arr1.forEach((v) => {
      const vArr = v.split('=');
      reqData[vArr[0]] = vArr[1];
    });
  }
  reqData['format'] = 'json';
  return {
    url,
    data: reqData,
  };
};

function handleJsonFn (resData) {
  if (Object.prototype.hasOwnProperty.call(resData, 'collection')) {
    resData = resData.collection.nft;
  } else if (resData.properties && resData.properties.image) {
    resData.image = resData.properties.image;
  }
  return resData;
};

function handleMetaDataImageFn (resData, id, fromAddress) {
  let imageInfo = null;
  if (resData.image) {
    //  uri -> json / image.url
    imageInfo = String(resData.image).replace(
      /ipfs:\/\//,
      'https://ipfs.io/ipfs/',
    );
  } else {
    imageInfo = `data:image/png;base64,${new Identicon(
      fromAddress + id,
      420,
    ).toString()}`;
  }
  return imageInfo;
// eslint-disable-next-line react-hooks/exhaustive-deps
};

function handleNftInfoFn (asset, from, protocol, fromAddress, list) {
  const fn = async () => {
    let result = null;
    try {
      result = await Promise.all(
        Object.values(list).map((item) => {
          const data = {
            name: asset,
            image: `data:image/png;base64,${new Identicon(
              fromAddress + item.id,
              420,
            ).toString()}`,
          };
          if (item.uri) {
            let sendData = handleUriFn(item.uri);
            return resServer
              .get(sendData.url, {
                params: {
                  ...sendData.data,
                },
              })
              .then((res, err) => {
                if (err) {
                  return Promise.resolve({ data });
                } else {
                  return Promise.resolve(res);
                }
              })
              .catch((err) => {
                return Promise.resolve({ data });
              });
          } else {
            return Promise.resolve({ data });
          }
        }),
      );
      Object.values(list).forEach((item, index) => {
        let resData = handleJsonFn(result[index].data);
        item.name = resData.name || asset;
        let imageInfo = handleMetaDataImageFn(resData, new BigNumber(item.id).toFixed(), fromAddress);
        item.imgData = imageInfo;
        item.description = resData.description || '';
        item.id = new BigNumber(item.id).toFixed();
        item.balance = Number(item.balance);
        item.current = from;
        item.protocol = protocol;
        item.selected = false;
        item.addNum = 0;
      });

      // if (!nftBalanceLoading) {
      //   clearTimeout(nftTimer);
      //   nftTimer = setTimeout(() => setNftLoading(false), 100);
      // }

      return list;
    } catch (error) {
      console.error(error.message);
    }
  }
  fn();
};

export default handleNftInfoFn;