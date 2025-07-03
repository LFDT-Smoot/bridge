// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuthParams
 * @dev Helper contract to encode and decode crosschain function call parameters.
 */
abstract contract AuthParams {
    function encodeAuthParams(
        uint256 networkId,
        address contractAddress,
        bytes memory functionCallData
    ) public pure returns (bytes memory) {
        return
            bytes.concat(
                functionCallData,
                abi.encodePacked(networkId, contractAddress)
            );
    }

    function encodeAuthParamsBytes(
        uint256 networkId,
        bytes memory contractAddress,
        bytes memory functionCallData
    ) public pure returns (bytes memory packedData) {
        packedData = bytes.concat(
            functionCallData,
            abi.encodePacked(networkId, toEthAddress(contractAddress))
        );
    }

    function decodeAuthParams()
        public
        pure
        returns (uint256 networkId, address contractAddress)
    {
        bytes calldata allParams = msg.data;
        require(allParams.length >= 52, "Invalid input data length");
        assembly {
            // Decode networkId (last 52 to 32+20 bytes from the end)
            networkId := calldataload(sub(calldatasize(), 52))
            // Decode contractAddress (last 20 bytes from the end)
            contractAddress := shr(96, calldataload(sub(calldatasize(), 20)))
        }
    }

    function toEthAddress(bytes memory message) public pure returns (address) {
        bytes32 keccak256Hash = keccak256(message);
        address ethAddress = address(uint160(uint256(keccak256Hash)));
        return ethAddress;
    }
}
