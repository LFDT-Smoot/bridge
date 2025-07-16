require('dotenv').config()

const config = require('./config.js');
const {ethers} = require("ethers");
const WmbGatewaySc = require("./WmbGatewaySc");


const checkVerifery = async ()=> {
    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.webGateWay;
    let abi = config.abi.webGateWay;
    let sc = new WmbGatewaySc(nodeUrl, abi, scAddr);
    let ret = await sc.getVerifier();
    console.log('ret: ', ret);
}
const main = async () => {
    await checkVerifery();
}
main();