/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WmbGateway", function () {
  let WmbGateway, wmbGateway, MultiSigVerifier, verifier, owner, addr1, addr2, accounts, chainId;

  beforeEach(async function () {
    WmbGateway = await ethers.getContractFactory("WmbGateway");
    MultiSigVerifier = await ethers.getContractFactory("MultiSigVerifier");

    [owner, addr1, addr2, ...accounts] = await ethers.getSigners();
    verifier = await MultiSigVerifier.deploy([owner.address, addr1.address, addr2.address], 2);
    await verifier.waitForDeployment();

    wmbGateway = await WmbGateway.deploy();
    await wmbGateway.waitForDeployment();
    chainId = 2153201998;
    await wmbGateway.initialize(owner.address, chainId, verifier.target);
  });

  it("should initialize correctly", async function () {
    expect(await wmbGateway.chainId()).to.equal(chainId);
    expect(await wmbGateway.verifier()).to.equal(verifier.target);
    expect(await wmbGateway.maxGasLimit()).to.equal(8000000);
    expect(await wmbGateway.minGasLimit()).to.equal(150000);
    expect(await wmbGateway.defaultGasLimit()).to.equal(1000000);
    expect(await wmbGateway.maxMessageLength()).to.equal(10000);
  });

  it("should allow outbound call with valid fee", async function () {
    const networkId = 123;
    const contractAddress = ethers.hexlify(ethers.randomBytes(20));
    const functionCallData = "0x12345678";
    const fee = ethers.parseEther("0.001");

    await wmbGateway.batchSetBaseFees([networkId], ["1000000000"]);

    await expect(wmbGateway.outboundCall(
      networkId,
      contractAddress,
      functionCallData,
      { value: fee }
    )).to.emit(wmbGateway, "CrosschainFunctionCall");
  });

  it("should fail outbound call with insufficient fee", async function () {
    const networkId = 123;
    const contractAddress = ethers.hexlify(ethers.randomBytes(20));
    const functionCallData = "0x12345678";
    const fee = ethers.parseEther("0.0001");

    await wmbGateway.batchSetBaseFees([networkId], [ethers.parseEther("0.000000001")]);

    await expect(wmbGateway.outboundCall(
      networkId,
      contractAddress,
      functionCallData,
      { value: fee }
    )).to.be.revertedWith("WmbGateway: Fee too low");
  });

  it("should allow only owner to set gas limits", async function () {
    await expect(wmbGateway.connect(addr1).setGasLimit(9000000, 160000, 1100000)).to.be.reverted;

    await wmbGateway.setGasLimit(9000000, 160000, 1100000);

    expect(await wmbGateway.maxGasLimit()).to.equal(9000000);
    expect(await wmbGateway.minGasLimit()).to.equal(160000);
    expect(await wmbGateway.defaultGasLimit()).to.equal(1100000);
  });

  it("should allow only owner to set base fees", async function () {
    await expect(wmbGateway.connect(addr1).batchSetBaseFees([chainId], [ethers.parseEther("0.000000002")])).to.be.reverted;

    await wmbGateway.batchSetBaseFees([chainId], [ethers.parseEther("0.000000002")]);

    expect(await wmbGateway.baseFees(chainId)).to.equal(ethers.parseEther("0.000000002"));
  });

  it("should allow only owner to withdraw fees", async function () {
    const initialBalance = await ethers.provider.getBalance(owner.address);
    const fee = ethers.parseEther("0.001");
    const networkId = 123;


    await wmbGateway.batchSetBaseFees([networkId], ["1000000000"]);

    await wmbGateway.connect(addr1).outboundCall(
      networkId,
      ethers.hexlify(ethers.randomBytes(20)),
      "0x12345678",
      { value: fee }
    );

    await expect(wmbGateway.connect(addr1).withdrawFee(owner.address)).to.be.reverted;

    await wmbGateway.withdrawFee(owner.address);

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.above(initialBalance);
  });
});
