// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../interfaces/ICrosschainVerifier.sol";

contract MultiSigVerifier is ICrosschainVerifier {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private owners;

    uint256 public threshold;

    // ---------------------------------------------------------------------------
    // Replay protection & EIP-712 typed signature domain
    // ---------------------------------------------------------------------------

    /// @dev Monotonically increasing nonce for execTransaction.
    ///      Bumped BEFORE the external call (Checks-Effects-Interactions) so any
    ///      attempt to replay the same signatures (even reentrantly) sees the
    ///      nonce already consumed by `verify`.
    uint256 public nonce;

    /// @dev EIP-712 TYPE_HASH constants matching the off-chain typed-signer schema.
    ///      This contract uses `keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")`.
    bytes32 private constant _DOMAIN_TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant _NAME_HASH    = keccak256(bytes("MultiSigVerifier"));
    bytes32 private constant _VERSION_HASH = keccak256(bytes("1"));

    bytes32 private constant _EXEC_TX_TYPE_HASH = keccak256(
        "ExecTransaction(address to,bytes data,uint256 nonce)"
    );

    modifier onlySelf() {
        require(msg.sender == address(this), "only self");
        _;
    }

    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ExecTransactionExecuted(address indexed to, bytes data, uint256 indexed nonceUsed);

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "owners length must > 0");
        require(_threshold > 0, "threshold must > 0");
        require(_threshold <= _owners.length, "threshold must <= owners length");
        for (uint256 i = 0; i < _owners.length; i++) {
            owners.add(_owners[i]);
            emit OwnerAdded(_owners[i]);
        }
        threshold = _threshold;
        nonce = 0;
    }

    /// @dev Build the EIP-712 domain separator. Chain-specific, contract-specific,
    ///      so identical (to, data) on a different chain or different deployment of
    ///      this contract MUST produce a different digest and fail verification.
    function _domainSeparatorV4() private view returns (bytes32) {
        return keccak256(abi.encode(
            _DOMAIN_TYPE_HASH,
            _NAME_HASH,
            _VERSION_HASH,
            block.chainid,
            address(this)
        ));
    }

    /// @dev Compute the EIP-712 digest for an execTransaction call that is expected to
    ///      be signed off-chain by `threshold` of the owners.
    function hashExecTransaction(address to, bytes memory data, uint256 txNonce)
        public
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(abi.encode(
            _EXEC_TX_TYPE_HASH,
            to,
            keccak256(data),
            txNonce
        ));
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparatorV4(), structHash));
    }

    function getOwners() public view returns (address[] memory) {
        address[] memory result = new address[](owners.length());
        for (uint256 i = 0; i < owners.length(); i++) {
            result[i] = owners.at(i);
        }
        return result;
    }

    function addOwner(address owner) public onlySelf {
        require(!owners.contains(owner), "owner already exists");
        owners.add(owner);
        emit OwnerAdded(owner);
    }

    function swapOwner(address oldOwner, address newOwner) public onlySelf {
        require(owners.contains(oldOwner), "owner not exists");
        owners.remove(oldOwner);
        owners.add(newOwner);
        emit OwnerRemoved(oldOwner);
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) public onlySelf {
        require(owners.contains(owner), "owner not exists");
        owners.remove(owner);
        emit OwnerRemoved(owner);
    }

    function execTransaction(address to, bytes calldata data, bytes memory signatures) public {
        // --- Checks ---------------------------------------------------------------
        // Consume the nonce *before* verifying and calling externally. This enforces
        // Checks-Effects-Interactions: even if `to.call(data)` is malicious and tries
        // to re-enter this function, the nonce has already been bumped so the same
        // set of signatures cannot be reused.
        uint256 currentNonce = nonce;

        // Verify EIP-712 typed signature over (to, data, nonce).
        // Signatures are bound to chainId + address(this) via the domain separator,
        // which prevents replay on any other chain or any other deployment of this
        // contract that has the same owners.
        bytes32 typedDigest = hashExecTransaction(to, data, currentNonce);
        require(verify(typedDigest, signatures), "invalid signatures");

        // --- Effects --------------------------------------------------------------
        // Increment the nonce immediately (strict monotonic increase) so future calls
        // with the same (to, data) payload + same signatures MUST fail: the digest
        // will include a different nonce and `verify` will reject.
        nonce = currentNonce + 1;

        // --- Interactions ---------------------------------------------------------
        (bool success, bytes memory returnData) = to.call(data);
        require(success, string(returnData));

        emit ExecTransactionExecuted(to, data, currentNonce);
    }

    /// @dev verifies signatures
    /// @param dataHash hash of the data to be verified
    /// @param signatures concatenated rsv signatures, format {bytes32 r}{bytes32 s}{uint8 v}
    function verify(bytes32 dataHash, bytes memory signatures) public view returns (bool) {
        uint256 count = signatures.length / 65;
        require(count >= threshold, "insufficient signatures");
        address[] memory signers = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            (uint8 v, bytes32 r, bytes32 s) = signatureSplit(signatures, i);
            address signer = ecrecover(dataHash, v, r, s);
            require(owners.contains(signer), "invalid signer");
            // check duplicate signer
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "duplicate signer");
            }
            signers[i] = signer;
        }
        return true;
    }

    function decodeAndVerify(
        uint256 /*networkId*/,
        bytes calldata encodedInfo,
        bytes calldata encodedProof
    ) external view returns (bytes memory decodedInfo) {
        require(encodedInfo.length > 0, "MultiSigVerifier: invalid encodedInfo");
        require(encodedProof.length > 0, "MultiSigVerifier: invalid encodedProof");
        Proof memory proof = abi.decode(encodedProof, (Proof));
        require(proof.signatures.length >= threshold, "MultiSigVerifier: insufficient signatures");

        address[] memory signers = new address[](proof.signatures.length);

        bytes32 dataHash = keccak256(encodedInfo);

        for (uint256 i = 0; i < proof.signatures.length; i++) {
            (uint8 v, bytes32 r, bytes32 s) = (
                uint8(proof.signatures[i].sigV),
                bytes32(proof.signatures[i].sigR),
                bytes32(proof.signatures[i].sigS)
            );
            address signer = ecrecover(dataHash, v, r, s);
            require(owners.contains(signer), "MultiSigVerifier: invalid signer");
            // check duplicate signer
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "MultiSigVerifier: duplicate signer");
            }
            signers[i] = signer;
        }
        return encodedInfo;
    }

    /// @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
    /// @notice Make sure to peform a bounds check for @param pos, to avoid out of bounds access on @param signatures
    /// @param pos which signature to read. A prior bounds check of this parameter should be performed, to avoid out of bounds access
    /// @param signatures concatenated rsv signatures
    function signatureSplit(bytes memory signatures, uint256 pos)
        internal
        pure
        returns (
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(signatures, add(signaturePos, 0x41))), 0xff)
        }
    }
}