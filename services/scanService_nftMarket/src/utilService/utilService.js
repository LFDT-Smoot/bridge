
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

    sleep(time) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve();
        }, time);
      })
    }
};


