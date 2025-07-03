
'use strict';

const Web3 = require("web3");
let web3 = new Web3();

const elliptic = require('elliptic')
const secp256k1 = elliptic.ec('secp256k1');

let frameworkService = require("../frameworkService/frameworkService");

module.exports = class Secp256k1Service {
  constructor(){
  }

  verifySignature(hexPk, hexHash, hexSign) {
    let utilService = frameworkService.getService("UtilService");
    let pk = utilService.hexTrip0x(hexPk);
    let hex_signature = utilService.hexTrip0x(hexSign);
    let keyPair = secp256k1.keyFromPublic(Buffer.from(pk, "hex"));

    let buf_signature = Buffer.from(hex_signature, "hex");
    let verify_signature = {
      r : Buffer.from(buf_signature.slice(0, 32)),
      s : Buffer.from(buf_signature.slice(32, 64))
    };

    return keyPair.verify(hexHash, verify_signature);
  }

  test_sign_verify() {
    console.log("\n secp256k1 test_sign_verify");
    // const keyPair = secp256k1.genKeyPair();
    // let prvKey = keyPair.getPrivate("hex");
    // console.log("prvKey :", prvKey);
    // let pk = keyPair.getPublic("hex");
    let prvKey = "2d2a964b82a54a0761904087f55043dd8a54fcc997a8f2a042a26e8761791cb2";
    let pk = "0421b1bf4c5b958d8158862f263b192555b0e1dae5d39a636b61229d91540cd985d55cd3bf01555e1279ae6332eb3955607a883b8e8a433b4095b499c1e25805d8";
    //console.log("pk :", pk);

    let keyPair2 = secp256k1.keyFromPrivate(prvKey);
    //let prvKey2 = keyPair2.getPrivate("hex");
    //console.log("prvKey2:", prvKey2);
    //let pk2 = keyPair2.getPublic("hex");
    //console.log("pk2:", pk2);

    let msg = "adfdasfdas;fdkasfkjadsk;fadskjfd;kasfdsdfd";
    let msgHash = web3.utils.sha3(msg);
    console.log("msgHash:", msgHash);
    let signature = keyPair2.sign(msgHash);
    // console.log("signature:", signature);
    // console.log("signature.r:", signature.r);
    // console.log("signature.r:", signature.r.toString("hex"));
    // console.log("signature.s:", signature.s);
    // console.log("signature.s:", signature.s.toString("hex"));
    //let recoveryParam = signature.recoveryParam;
    //console.log("recoveryParam:", recoveryParam);

    let hexSignature = signature.r.toString("hex") + signature.s.toString("hex") + signature.recoveryParam.toString().padStart(2, "0");
    console.log("hexSignature:", hexSignature);
    // {
    //   let verify = keyPair2.verify(msgHash, signature);
    //   console.log("verify 1:", verify);
    // }

    // {
    //   let verify = secp256k1.verify(msgHash, signature, keyPair2);
    //   console.log("verify 2:", verify);
    // }

    // {
    //   let keyPair3 = secp256k1.keyFromPublic(Buffer.from(pk, "hex"));
    //   let verify = secp256k1.verify(msgHash, signature, keyPair3);
    //   console.log("verify 3:", verify);
    // }

    // {
    //   let keyPair4 = secp256k1.keyFromPublic(Buffer.from(pk, "hex"));
    //   let verify = keyPair4.verify(msgHash, signature);
    //   console.log("verify 4:", verify);
    // }

    // {
    //   let keyPair4 = secp256k1.keyFromPublic(Buffer.from(pk, "hex"));
    //   let buf_signature = Buffer.from(hexSignature, "hex");
    //   let verify_signature = {
    //     r : Buffer.from(buf_signature.slice(0, 32)),
    //     s : Buffer.from(buf_signature.slice(32, 64))
    //   }

    //   let verify = keyPair4.verify(msgHash, verify_signature);
    //   console.log("verify 5:", verify);
    // }

    let verify = this.verifySignature(pk, msgHash, hexSignature);
    //console.log("verify 6:", verify);
  }
};

