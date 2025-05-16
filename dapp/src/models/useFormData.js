/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { createGlobalStore } from 'hox';
import { useEffect, useState } from 'react';

const initial = {
  polygonAddress: null,
  stellarAddress: null,
  name: null,
  description: null,
  image: '',
  id: '',
  price: null,
  symbol: null,
  fee: 0,
  total: '0',
  src: '',
  nftInfo: null
};

const useFormData = () => {
  const [values, setValues] = useState(() => initial);
  const [isValid, setIsValid] = useState(false);

  const modify = (newData) => {
    setValues((newestState) => {
      return {
        ...newestState,
        ...newData,
      };
    });
  };

  useEffect(() => {
    setIsValid(typeof values.name === 'string' && values.name.length > 0);
  }, [values.name]);

  const reset = () => {
    setValues(initial);
    setIsValid(false);
  };

  const resetNftInfo = () => {
    const info = JSON.parse(JSON.stringify(values));
    info.nftInfo = {};
    setValues(info);
  }

  return {
    data: values,
    isValid,
    modify,
    reset,
    resetNftInfo
  };
};

const [useFormDataModal] = createGlobalStore(useFormData);


export default useFormDataModal;
