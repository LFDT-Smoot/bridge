require('dotenv').config()
const NftMarket = require('./NftMarketSc');
const config = require('./config.js');
const {ethers} = require("ethers");
const {convertToEthAddress } = require('./common.js')
const getStellarScAddr = async ()=> {
    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.nftMarket;
    let abi = config.abi.nftMarket;

    let nftMarket = new NftMarket(nodeUrl, abi, scAddr);

    let stellarAddress = await nftMarket.getStellarContractAddress();
    console.log('stellarAddress', stellarAddress);
}

const updateStellarContractAddress = async ()=> {

    let words = process.env.words;
    let stellar_nft_market_sc = config.stellarScAddr.nft_market;

    let wallet = ethers.Wallet.fromPhrase(words);

    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.nftMarket;
    let abi = config.abi.nftMarket;
    let nftMarket = new NftMarket(nodeUrl, abi, scAddr);

    const Web3 = require("web3");
    const web3 = new Web3();
    const ret = web3.utils.asciiToHex(stellar_nft_market_sc);
    console.log('ret: ', ret)


    await nftMarket.updateStellarContractAddress(wallet,ret);

}
const updateTrustAddress = async ()=> {
        let words = process.env.words;
    let stellar_nft_market_sc = config.stellarScAddr.nft_market;

    let wallet = ethers.Wallet.fromPhrase(words);

    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.nftMarket;
    let abi = config.abi.nftMarket;
    let nftMarket = new NftMarket(nodeUrl, abi, scAddr);

    let chains = [2147483796];
    
    let froms = [new Buffer.from(stellar_nft_market_sc)];
    let trusted = [true]

    await nftMarket.updateTruestAddress(wallet, chains, froms, trusted);

}

const checkTrustAddress = async ()=> {
    let words = process.env.words;
    let stellar_nft_market_sc = config.stellarScAddr.nft_market;

    let wallet = ethers.Wallet.fromPhrase(words);

    let nodeUrl = config.nodeUrl;
    let scAddr = config.scAddr.nftMarket;
    let abi = config.abi.nftMarket;
    let nftMarket = new NftMarket(nodeUrl, abi, scAddr);

    let chains = 2147483796;

    console.log('stellar_nft_market_sc: ', stellar_nft_market_sc);
    
    let from = convertToEthAddress(stellar_nft_market_sc);
    console.log('from: ', from)

    await nftMarket.checkTrustAddress(chains, from);
}




const main = async () => {
    //await getStellarScAddr();
    //await updateStellarContractAddress();
    await checkTrustAddress();
   // await updateTrustAddress();
    
}

main();