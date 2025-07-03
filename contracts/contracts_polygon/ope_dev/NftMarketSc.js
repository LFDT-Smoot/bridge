
const ethers = require('ethers');
class NftMarket {
    constructor(nodeUrl, abi, scaddr) {
        this.nodeUrl = nodeUrl;
        this.abi = abi;
        this.scaddr = scaddr;
        this.provider = new ethers.JsonRpcProvider(this.nodeUrl);
        this.sc = new ethers.Contract(scaddr,abi, this.provider);
    }
    async updateStellarContractAddress(wallet, stellar_nft_market_sc) {
        let signer = wallet.connect(this.provider);

        let signedSc = this.sc.connect(signer);
        let tx = await signedSc.updateStellarContract(stellar_nft_market_sc);
        let ret = await tx.wait();
        console.log(ret);
    }
    async getStellarContractAddress() {
        let stellarContractAddress = await this.sc.stellarContract();
        return stellarContractAddress;
    }
    async updateTruestAddress(wallet, chainids, froms, trusteds) {
         let signer = wallet.connect(this.provider);

        let signedSc = this.sc.connect(signer);
        let tx = await signedSc.setTrustedRemotesBytes(chainids, froms, trusteds);
        let ret = await tx.wait();
        console.log(ret);
    }

    async checkTrustAddress (chainid, from) {
        let ret = await this.sc.trustedRemotes(chainid, from);
        console.log('ret:', ret);
    }

}


module.exports = NftMarket;

