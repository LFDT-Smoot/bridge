// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Signature {
    uint256 by;
    uint256 sigR;
    uint256 sigS;
    uint256 sigV;
    bytes32 meta;
}

struct Proof {
    uint256 typ;
    bytes proofData;
    Signature[] signatures;
}

interface ICrosschainVerifier {
    function decodeAndVerify(
        uint256 networkId,
        bytes calldata encodedInfo,
        bytes calldata encodedProof
    ) external view returns (bytes memory decodedInfo);
}
