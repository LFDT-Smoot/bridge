/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// scripts/deploy.js

const PROXY_ADMIN = '0xb7Bf86Fe4758c461D4a0a6BefE849f830487880f';
const PROXY_ADDRESS = '0xaA486ca50A0cb9c8d154ff7FfDcE071612550042';


async function main() {
  const [deployer] = await ethers.getSigners();

  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdmin = await ProxyAdmin.attach(PROXY_ADMIN);

  console.log("ProxyAdmin address:", proxyAdmin.target);

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy logic contract
  const CrossSwapExecutor = await ethers.getContractFactory("WmbGateway");

  const crossSwapExecutor = await CrossSwapExecutor.deploy();
  await crossSwapExecutor.waitForDeployment();
  console.log("WmbGateway deployed to:", crossSwapExecutor.target);


  await proxyAdmin.upgradeAndCall(PROXY_ADDRESS, crossSwapExecutor.target, '0x');

  console.log("Contract upgrade successfully!");
}

// 处理可能的错误
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
