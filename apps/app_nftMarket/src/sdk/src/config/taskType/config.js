const config = [
  {
    name: "ProcessStellarSellOrder",
    handle: require("./ProcessStellarSellOrder.js").default
  },
  {
    name: "ProcessStellarCancelOrder",
    handle: require("./ProcessStellarCancelOrder").default
  },
  {
    name: "ProcessStellarTransferNft",
    handle: require("./ProcessStellarTransferNft").default
  },
  {
    name: "ProcessEvmBuyNft",
    handle: require("./ProcessEvmBuyNft").default
  },
  {
    name: "ProcessEvmUnwrapNft",
    handle: require("./ProcessEvmUnwrapNft").default
  }
];

export default config;