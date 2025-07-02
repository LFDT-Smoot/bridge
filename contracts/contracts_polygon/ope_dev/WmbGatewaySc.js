const ethers = require('ethers');
class WmbGatewaySc {
    constructor(nodeUrl, abi, scaddr) {
        this.nodeUrl = nodeUrl;
        this.abi = abi;
        this.scaddr = scaddr;
        this.provider = new ethers.JsonRpcProvider(this.nodeUrl);
        this.sc = new ethers.Contract(scaddr, abi, this.provider);
    }

    async getVerifier() {
        return await this.sc.verifier();
    }
}

module.exports = WmbGatewaySc;