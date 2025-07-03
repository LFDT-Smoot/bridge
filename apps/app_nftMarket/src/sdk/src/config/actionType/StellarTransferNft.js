export default class StellarTransferNft {
  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, tokenId, toAccount}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessStellarTransferNft";
    console.debug("StellarTransferNft params: %O", params);
    let steps = [
      {name: "Transfer NFT", params}
    ];
    return steps;
  }
};
