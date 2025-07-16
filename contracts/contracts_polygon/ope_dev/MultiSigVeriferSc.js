const ethers = require('ethers');
class MultiSigVeriferSc {
    constructor(nodeUrl, abi, scaddr) {
        this.nodeUrl = nodeUrl;
        this.abi = abi;
        this.scaddr = scaddr;
        this.provider = new ethers.JsonRpcProvider(this.nodeUrl);
        this.sc = new ethers.Contract(scaddr, abi, this.provider);
    }
    async getThreshold () {
        let ret = await this.sc.threshold();
        return ret;
    }
    async getOwners() {
        return await this.sc.getOwners();
    }
}

module.exports = MultiSigVeriferSc;

