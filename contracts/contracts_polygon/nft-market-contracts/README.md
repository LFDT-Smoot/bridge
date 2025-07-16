# NftMarket Contract

The `NftMarket` contract is a cross-chain NFT marketplace that leverages the Wanchain Message Bridge (WMB) to facilitate cross-chain NFT transactions. This README provides an overview of the contract's main functionalities and interfaces.

## Overview

`NftMarket` is an upgradeable, cross-chain NFT marketplace that supports the buying and selling of NFTs using various ERC20 tokens. It interacts with the Stellar blockchain via the Wanchain Message Bridge, allowing NFTs to be minted, bought, and unwrapped across different chains.

## Unit Tests

To run the unit tests, execute the following command:

```bash
$ yarn
$ export PK=0x<private_key>
$ yarn hardhat compile
$ yarn hardhat test
```

## Deployment

```bash
$ export PK=0x<private_key>
$ yarn hardhat --network polygonAmoy run scripts/deploy_testnet.js
```


## Main Functionalities

### Initialization

- **`initialize`**
  Initializes the contract with the admin, gateway address, Stellar chain ID, and Stellar contract address.
  ```solidity
  function initialize(address admin, address gateway, uint256 _stellarBip44ChainId, bytes memory _stellarContract) public initializer;
  ```

### Core Features

- **Buying Orders**
  Allows users to buy an NFT listed in the marketplace. The price can be paid in ETH or any ERC20 token specified in the order.
  ```solidity
  function buyOrder(bytes32 orderKey) external payable nonReentrant;
  ```

- **Creating Orders (Cross-Chain)**
  Creates an order for selling an NFT. This function is called via cross-chain messages.
  ```solidity
  function createOrder(MessageData memory messageData) internal;
  ```

- **Cancelling Orders (Cross-Chain)**
  Cancels an existing order. This function is called via cross-chain messages.
  ```solidity
  function cancelOrder(MessageData memory messageData) internal;
  ```

- **Minting Wrapped NFTs**
  Mints a wrapped NFT representing an NFT from the Stellar blockchain.
  ```solidity
  function mintWrappedNFT(MessageData memory messageData, address _to) internal;
  ```

- **Unwrapping NFTs**
  Handles the reception and unwrapping of NFTs. The unwrapped NFTs are transferred to the specified Stellar wallet address.
  ```solidity
  function onERC721Received(address, address, uint256 tokenId, bytes memory data) public override returns (bytes4);
  ```

### Utility Functions

- **Retrieve Order Count**
  Returns the total number of active orders.
  ```solidity
  function orderCount() external view returns (uint256);
  ```

- **Get All Orders**
  Retrieves all active orders and their details.
  ```solidity
  function getAllOrders() external view returns (bytes32[] memory, OrderInfo[] memory);
  ```

- **Get Order Info by Range**
  Retrieves a range of orders and their details based on the provided start and end indices.
  ```solidity
  function getOrderInfoByRange(uint256 start, uint256 end) public view returns (bytes32[] memory, OrderInfo[] memory);
  ```

### Administrative Functions

- **Withdraw Fee**
  Withdraws the collected fees to the specified address.
  ```solidity
  function withdrawFee(address _to) external onlyOwner;
  ```

- **Update Stellar Chain ID**
  Updates the Stellar chain ID used for cross-chain transactions.
  ```solidity
  function updateStellarChainId(uint256 _stellarBip44ChainId) external onlyOwner;
  ```

- **Update Stellar Contract**
  Updates the Stellar contract address used for cross-chain transactions.
  ```solidity
  function updateStellarContract(bytes memory _stellarContract) external onlyOwner;
  ```

## Events

- **OrderCreated**
  Emitted when a new order is created.
  ```solidity
  event OrderCreated(MessageData messageData);
  ```

- **OrderCancelledSuccess**
  Emitted when an order is successfully cancelled.
  ```solidity
  event OrderCancelledSuccess(MessageData messageData);
  ```

- **OrderCancelledFailed**
  Emitted when an order cancellation fails.
  ```solidity
  event OrderCancelledFailed(MessageData messageData);
  ```

- **BuyOrder**
  Emitted when an order is successfully purchased.
  ```solidity
  event BuyOrder(bytes32 indexed orderKey, address indexed buyer, bytes nftContract, uint256 nftId, address priceToken, uint256 price, address recipient);
  ```

- **UnwrapNFT**
  Emitted when an NFT is unwrapped and sent back to the Stellar blockchain.
  ```solidity
  event UnwrapNFT(uint256 tokenId, bytes receiver, bytes nftContract, uint256 nftId);
  ```

- **MintWrappedNFT**
  Emitted when a new wrapped NFT is minted.
  ```solidity
  event MintWrappedNFT(address to, uint tokenId, bytes stellarNFTContract, uint256 stellarNFTId);
  ```

## Important Notes

- **Cross-Chain Message Handling**
  The contract includes functions (`createOrder` and `cancelOrder`) that are meant to be called via cross-chain messages. These functions should not be directly called by users.
  
- **Receiving Payments**
  The contract can receive MATIC for message bridge fees. Ensure sufficient MATIC is sent with cross-chain transactions to cover these fees.

## Conclusion

The `NftMarket` contract facilitates a seamless cross-chain NFT marketplace by leveraging the Wanchain Message Bridge. It supports creating, cancelling, and buying NFT orders, along with minting and unwrapping wrapped NFTs, enabling interaction between the Ethereum and Stellar blockchains.

