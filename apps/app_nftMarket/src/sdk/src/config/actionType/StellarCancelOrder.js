export default class StellarCancelOrder {
  async process(actionInfo) {
    // basic: {action, fromChainName, fromAccount, orderKey}
    let params = Object.assign({}, actionInfo);
    params.taskType = "ProcessStellarCancelOrder";
    console.debug("StellarCancelOrder params: %O", params);
    let steps = [
      {name: "Cancle Order", params}
    ];
    return steps;
  }
};
