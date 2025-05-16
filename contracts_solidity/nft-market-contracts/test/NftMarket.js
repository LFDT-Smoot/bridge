/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { AbiCoder } = require("ethers");
const abiCoder = new AbiCoder();

const STELLAR_CONTRACT = "0x" + '0'.repeat(63) + '1';
const STELLAR_NFT_CONTRACT = "0x" + '0'.repeat(63) + '2';

describe("NftMarket", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy("Mock Token", "MCK");

    // Deploy MockGateway
    const MockGateway = await ethers.getContractFactory("MockGateway");
    const mockGateway = await MockGateway.deploy();

    // Deploy NftMarket
    const NftMarket = await ethers.getContractFactory("NftMarket");
    const nftMarket = await NftMarket.deploy();

    await nftMarket.initialize(owner.address, mockGateway.target, 1, STELLAR_CONTRACT);

    await mockGateway.setNftMarket(nftMarket.target);

    await user2.sendTransaction({to: nftMarket.target, value: ethers.parseEther("100")});

    await nftMarket.setTrustedRemotesBytes([1],[STELLAR_CONTRACT],[true]);

    return { nftMarket, mockERC20, mockGateway, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner and gateway", async function () {
      const { nftMarket, owner, mockGateway } = await deployFixture();

      expect(await nftMarket.owner()).to.equal(owner.address);
      expect(await nftMarket.wmbGateway()).to.equal(mockGateway.target);
    });
  });

  describe("Order Management", function () {
    it("Should create an order", async function () {
      const { nftMarket, mockGateway, user1, mockERC20 } = await deployFixture();

      const messageData = {
        messageType: "CreateOrder",
        nftContract: STELLAR_NFT_CONTRACT,
        nftId: 1,
        priceToken: mockERC20.target,
        price: ethers.parseEther("1"),
        recipient: user1.address,
        buyer: "0x"
      };

      let scData = await nftMarket.getEncode(messageData);

      await expect(mockGateway.inboundCall(scData, 1, STELLAR_CONTRACT))
        .to.emit(nftMarket, "OrderCreated")
        .withArgs(Object.values(messageData));

      const orderCount = await nftMarket.orderCount();
      expect(orderCount).to.equal(1);
    });

    it("Should cancel an order successfully", async function () {
      const { nftMarket, mockGateway, user1, mockERC20 } = await deployFixture();

      const messageData = {
        messageType: "CreateOrder",
        nftContract: STELLAR_NFT_CONTRACT,
        nftId: 1,
        priceToken: mockERC20.target,
        price: ethers.parseEther("1"),
        recipient: user1.address,
        buyer: "0x"
      };

      let scData = await nftMarket.getEncode(messageData);

      await mockGateway.inboundCall(scData, 1, STELLAR_CONTRACT);

      console.log(await nftMarket.orderCount());

      const cancelData = {
        messageType: "CancelOrder",
        nftContract: STELLAR_NFT_CONTRACT,
        nftId: 1,
        priceToken: mockERC20.target,
        price: ethers.parseEther("1"),
        recipient: user1.address,
        buyer: "0x"
      };

      scData = await nftMarket.getEncode(cancelData);
      await expect(mockGateway.inboundCall(scData, 1, STELLAR_CONTRACT))
        .to.emit(nftMarket, "OrderCancelledSuccess");

      const orderCount = await nftMarket.orderCount();
      expect(orderCount).to.equal(0);
    });

    it("Should fail to cancel a non-existent order", async function () {
      const { mockGateway, user1, mockERC20, nftMarket } = await deployFixture();

      const cancelData = {
        messageType: "CancelOrder",
        nftContract: STELLAR_NFT_CONTRACT,
        nftId: 1,
        priceToken: mockERC20.target,
        price: ethers.parseEther("1"),
        recipient: user1.address,
        buyer: "0x"
      };

      scData = await nftMarket.getEncode(cancelData);

      await expect(mockGateway.inboundCall(scData, 1, STELLAR_CONTRACT))
        .to.emit(nftMarket, "OrderCancelledFailed");

      const orderCount = await nftMarket.orderCount();
      expect(orderCount).to.equal(0);
    });

    it("Should buy an order", async function () {
      const { nftMarket, mockGateway, user1, user2, mockERC20 } = await deployFixture();

      const messageData = {
        messageType: "CreateOrder",
        nftContract: STELLAR_NFT_CONTRACT,
        nftId: 1,
        priceToken: mockERC20.target,
        price: ethers.parseEther("1"),
        recipient: user1.address,
        buyer: "0x"
      };

      scData = await nftMarket.getEncode(messageData);
      
      await mockGateway.inboundCall(scData, 1, STELLAR_CONTRACT);
      await mockERC20.mint(user2.address, ethers.parseEther("1"));
      await mockERC20.connect(user2).approve(nftMarket.target, ethers.parseEther("1"));
      let orders = await nftMarket.getAllOrders();
      const orderKey = orders[0][0];
      const fee = await nftMarket.estimateFee(1, 400000);
      await expect(nftMarket.connect(user2).buyOrder(orderKey, {value: fee}))
        .to.emit(nftMarket, "BuyOrder")
        .withArgs(orderKey, user2.address, orders[1][0][0][1], orders[1][0][0][2], mockERC20.target, ethers.parseEther("1"), user1.address);

      const orderCount = await nftMarket.orderCount();
      expect(orderCount).to.equal(0);
    });
  });

  describe("Fee Management", function () {
    it("Should withdraw fees to the owner", async function () {
      const { nftMarket, owner, user1, mockERC20, mockGateway } = await deployFixture();
      await nftMarket.withdrawFee(owner.address);
    });
  });
});
