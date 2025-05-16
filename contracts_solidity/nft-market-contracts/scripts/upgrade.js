/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// scripts/deploy.js

const PROXY_ADMIN = '0xA9a192b382a22D6a2a80D600b602E750F39ADc66';
const PROXY_ADDRESS = '0x77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1';


async function main() {
  const [deployer] = await ethers.getSigners();

  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdmin = await ProxyAdmin.attach(PROXY_ADMIN);

  console.log("ProxyAdmin address:", proxyAdmin.target);

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy logic contract
  const CrossSwapExecutor = await ethers.getContractFactory("NftMarket");

  const crossSwapExecutor = await CrossSwapExecutor.deploy();
  await crossSwapExecutor.waitForDeployment();
  console.log("NftMarket deployed to:", crossSwapExecutor.target);


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
