// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IEEA.sol";

/**
 * @title IWmbGateway
 * @dev Interface for the Wanchain Message Bridge Gateway contract
 * @dev This interface is used to send and receive messages between chains
 * @dev This interface is based on EIP-5164
 * @dev It extends the EIP-5164 interface, adding a custom gasLimit feature.
 */
interface IWmbGateway is ICrosschainFunctionCall, IEstimateGas, ITaskManager {
    error SignatureVerifyFailed(
        bytes32 sigHash,
        bytes signatures
    );
}
