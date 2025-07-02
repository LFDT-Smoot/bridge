# Message Bridge Contracts

This repository contains the smart contracts for the Message Bridge. The Message Bridge is a decentralized messaging system that allows users to send messages across different blockchains. Message Bridge is designed to comply with EEA standards.

## Overview
The `WmbGateway` smart contract is the main entry point of the Wanchain message bridge system. It facilitates cross-chain message between different blockchain networks by serving as a gateway. This contract leverages the functionalities of the OpenZeppelin library for security and utility purposes.

## Features
- Cross-chain message
- Gas limit and fee management
- Security against replay attacks
- Configurable parameters for efficient cross-chain operations

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



## Usage
### Initialization
Initialize the contract with the admin address, local chain ID, and verifier address.
```solidity
function initialize(address admin, uint256 chainId_, address _verifier) public initializer {
    require(admin != address(0), "WmbGateway: Invalid admin address");

    chainId = chainId_;
    verifier = _verifier;
    maxGasLimit = 8_000_000;
    minGasLimit = 150_000;
    defaultGasLimit = 1_000_000;
    maxMessageLength = 10_000;

    __Ownable_init(admin);
    __ReentrancyGuard_init();
}
```

### Cross-chain Function Call
Initiate a cross-chain function call to a target contract on a different blockchain network.
```solidity
function outboundCall(
    uint256 networkId,
    bytes calldata contractAddress,
    bytes calldata functionCallData
) external payable {
    require(msg.value >= minGasLimit * baseFees[networkId], "WmbGateway: Fee too low");
    require(msg.value <= maxGasLimit * baseFees[networkId], "WmbGateway: Fee too large");

    bytes memory finallyFunctionCallData = encodeAuthParams(chainId, msg.sender, functionCallData);

    uint gasLimit = _getGasLimitFromValue(networkId);
    bytes32 taskId = genTaskId(networkId, contractAddress, finallyFunctionCallData);
    messageGasLimit[taskId] = gasLimit;

    emit CrosschainFunctionCall(
        taskId,
        networkId,
        contractAddress,
        finallyFunctionCallData
    );

    emit OutboundTaskExecuted(
        taskId,
        networkId,
        contractAddress,
        finallyFunctionCallData
    );
}
```

### Gas Fee Estimation
Estimate the gas fee required for a cross-chain transaction.
```solidity
function estimateGas(
    uint256 targetChainId,
    uint256 gasLimit,
    bytes calldata /*data*/
) public view returns (uint256 fee) {
    require(gasLimit <= maxGasLimit, "WmbGateway: Gas limit exceeds maximum");
    if (gasLimit < minGasLimit) {
        return baseFees[targetChainId] * minGasLimit;
    }
    return baseFees[targetChainId] * gasLimit;
}
```

### Inbound Message Handling
Receive and process a message sent from another chain.
```solidity
function inboundCall(
    uint256 networkId,
    bytes calldata encodedInfo,
    bytes calldata encodedProof
) external payable {
    bytes memory verifiedEncodeInfo = ICrosschainVerifier(verifier).decodeAndVerify(networkId, encodedInfo, encodedProof);
    EncodedInfo memory info = abi.decode(verifiedEncodeInfo, (EncodedInfo));
    require(networkId == chainId, "WmbGateway: Invalid networkId #1");
    require(info.networkId == chainId, "WmbGateway: Invalid networkId #2");

    _receiveMessage(
        info.taskId,
        ReceiveMsgData(
            info.contractAddress,
            info.functionCallData
        )
    );

    emit InboundTaskExecuted(
        info.taskId,
        info.networkId,
        info.contractAddress,
        info.functionCallData
    );
}
```

### Administrative Functions
Manage base fees, gas limits, and other configurations.
```solidity
function batchSetBaseFees(uint256[] memory _targetChainIds, uint256[] memory _baseFees) external onlyOwner {
    require(_targetChainIds.length == _baseFees.length, "WmbGateway: Invalid input");
    for (uint256 i = 0; i < _targetChainIds.length; i++) {
        baseFees[_targetChainIds[i]] = _baseFees[i];
    }
}

function setGasLimit(uint256 _maxGasLimit, uint256 _minGasLimit, uint256 _defaultGasLimit) external onlyOwner {
    maxGasLimit = _maxGasLimit;
    minGasLimit = _minGasLimit;
    defaultGasLimit = _defaultGasLimit;
}

function setMaxMessageLength(uint256 _maxMessageLength) external onlyOwner {
    maxMessageLength = _maxMessageLength;
}

function withdrawFee(address payable _to) external onlyOwner {
    Address.sendValue(_to, address(this).balance);
}

function changeVerifier(address _verifier) external onlyOwner {
    verifier = _verifier;
}
```

## Events
- `CrosschainFunctionCall(bytes32 taskId, uint256 networkId, bytes contractAddress, bytes functionCallData)`
- `OutboundTaskExecuted(bytes32 taskId, uint256 networkId, bytes contractAddress, bytes functionCallData)`
- `InboundTaskExecuted(bytes32 taskId, uint256 networkId, bytes contractAddress, bytes functionCallData)`

## Security Considerations
- Ensure the admin address is secured.
- Regularly update the verifier contract to adapt to potential security threats.
- Monitor gas limits and fee structures to prevent abuse or unexpected costs.

## License
This project is licensed under the MIT License.