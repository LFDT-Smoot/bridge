require('dotenv').config()

const config = require('./config.js');
const {ethers} = require("ethers");
const MultiSigVeriferSc = require('./MultiSigVeriferSc');

const getThrose = async ()=>{
    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.multiSigVerifier;
    let abi = config.abi.multiSigVerifier;
    let sc = new MultiSigVeriferSc(nodeUrl, abi, scAddr);
    let ret = await sc.getThreshold();
    console.log(ret);

    let owers = await sc.getOwners();
    console.log('owers: ', owers);
}

const main = async () => {
    await getThrose();
}
main();