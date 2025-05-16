/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// scripts/deploy.js

const OWNER_ADDRESS = '0xF6eB3CB4b187d3201AfBF96A38e62367325b29F9';
const BIP44_CHAINID = 2147484614;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  let LogicContractName = 'MultiSigVerifier';
  let initializeParams = [
    [
      OWNER_ADDRESS,
      "0xde1ABaCb89265b165e32076CE23BC879D1168ebA",
      "0xe9D82B13E2Caecd02679a1336036Ea970C142951",
      "0xea3cC52495acD693cd237137c43a563Ae15F436C",
      "0xc42F0f35f7b15494D757416b072cc3E0ebc5a3B3",
      "0xDAEd9fC82972fA42b402Eb0Abf42E9BcC327f7Fe",
    ],
    2,
  ];

  // Deploy logic contract
  let Logic = await ethers.getContractFactory(LogicContractName);

  let logic = await Logic.deploy(...initializeParams);
  await logic.waitForDeployment();
  console.log(LogicContractName, "Logic address:", logic.target);

}

// 处理可能的错误
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
