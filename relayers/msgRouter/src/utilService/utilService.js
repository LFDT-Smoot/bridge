/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';


module.exports = class UtilService {
    constructor(){
    }

    hexTrip0x(hexs) {
      if (0 == hexs.indexOf('0x')) {
          return hexs.slice(2);
      }
      return hexs;
    }
    
    hexAdd0x(hexs) {
      if (0 != hexs.indexOf('0x')) {
          return '0x' + hexs;
      }
      return hexs;
    }
};


