// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct EncodedInfo {
    bytes32 taskId;
    uint256 networkId;
    address contractAddress;
    bytes functionCallData;
}

interface ICrosschainFunctionCall {
    function outboundCall(
        uint256 networkId,
        bytes calldata contractAddress,
        bytes calldata functionCallData
    ) external payable;

    function inboundCall(
        uint256 networkId,
        bytes calldata encodedInfo,
        bytes calldata encodedProof
    ) external payable;

    event CrosschainFunctionCall(
        bytes32 indexed taskId,
        uint256 indexed networkId,
        bytes contractAddress,
        bytes functionCallData
    );
}

interface ITaskManager {
    event OutboundTaskExecuted(
        bytes32 indexed taskId,
        uint256 indexed networkId,
        bytes contractAddress,
        bytes functionCallData
    );
    event InboundTaskExecuted(
        bytes32 indexed taskId,
        uint256 indexed networkId,
        address indexed contractAddress,
        bytes functionCallData
    );
}

interface IEstimateGas {
    function estimateGas(
        uint256 networkId,
        uint256 gasLimit,
        bytes calldata data
    ) external view returns (uint256 gas);
}
