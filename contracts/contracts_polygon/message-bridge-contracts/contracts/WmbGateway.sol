// SPDX-License-Identifier: MIT
pragma solidity >=0.8.18;

/**
 * Wanchain Message Bridge
 * https://wanchain.org/ 
 */

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IWmbGateway.sol";
import "./interfaces/IWmbConfig.sol";
import "./utils/AuthParams.sol";
import "./interfaces/ICrosschainVerifier.sol";

/**
 * @title WmbGateway
 * @dev The main entry point of Wanchain cross-chain asset transfer system.
 *      The contract serves as a gateway for cross-chain transactions between different blockchain networks. 
 */
contract WmbGateway is OwnableUpgradeable, ReentrancyGuardUpgradeable, IWmbGateway, IWmbConfig, AuthParams {
    // slip-0044 standands chainId for local chain
    uint256 public chainId;

    // Global maximum gas limit for a message
    uint256 public maxGasLimit;
    uint256 public minGasLimit;
    uint256 public defaultGasLimit;
    uint256 public maxMessageLength;
    address public verifier;


    // Mapping of message IDs to message execution status
    mapping(bytes32 => bool) public messageExecuted;

    // Mapping of target chain IDs to base fees
    mapping(uint256 => uint256) public baseFees;

    // Mapping of taskId to gas limit
    mapping(bytes32 => uint256) public messageGasLimit;

    // Mapping of sourceChainId->dstChainId->sourceContract->targetContract->nonce to prevent replay attacks
    mapping(uint256 => mapping(uint256 => mapping(address => mapping(bytes => uint256)))) public nonces;

    struct ReceiveMsgData {
        address targetContract;
        bytes functionCallData;
    }

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

    /**
     * @dev Public interface functions for the WMB Gateway contract.
     */

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

    // Receives a message sent from another chain
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

    /**
     * @dev Function for the WMB Gateway contract, to be used by the contract administrator.
     * These functions are only accessible to accounts with the DEFAULT_ADMIN_ROLE.
     */

    function batchSetBaseFees(uint256[] memory _targetChainIds, uint256[] memory _baseFees) external onlyOwner {
        // limit AccessControl
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

    function _getGasLimitFromValue(uint256 toChain) internal view returns (uint256) {
        if (baseFees[toChain] == 0) {
            return defaultGasLimit;
        }
        return msg.value / baseFees[toChain];
    }

    function genTaskId(
        uint256 targetChainId,
        bytes memory targetContract,
        bytes memory messageData
    ) internal returns (bytes32 taskId) {
        uint256 nonce = ++nonces[chainId][targetChainId][msg.sender][targetContract];
        require(messageData.length <= maxMessageLength, "WmbGateway: Message too long");
        taskId = keccak256(
            abi.encodePacked(
            chainId,
            msg.sender,
            targetChainId,
            targetContract,
            messageData,
            nonce
        ));
    }

    function _receiveMessage(
        bytes32 taskId,
        ReceiveMsgData memory data
    ) internal {
        require(!messageExecuted[taskId], "WmbGateway: Message already executed");
        messageExecuted[taskId] = true;
        Address.functionCall(data.targetContract, data.functionCallData);
    }

    function encodeInfo(EncodedInfo memory info) public pure returns (bytes memory) {
        return abi.encode(info);
    }

    function decodeInfo(bytes memory encodedInfo) public pure returns (EncodedInfo memory) {
        return abi.decode(encodedInfo, (EncodedInfo));
    }
}
