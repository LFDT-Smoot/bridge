// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../NftMarket.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract MockGateway {
    uint256 public fee = 0.01 ether;
    address public nftMarket;

    event MessageDispatched(uint toChainId, bytes to, bytes data, uint fee);
    event CustomVerifierRegistered(address verifier);

    modifier onlyNftMarket() {
        require(msg.sender == nftMarket, "Only NftMarket can call this function");
        _;
    }

    function setNftMarket(address _nftMarket) external {
        nftMarket = _nftMarket;
    }

    function estimateGas(uint256, uint256, bytes calldata) external view returns (uint256) {
        return fee;
    }

    function outboundCall(uint toChainId, bytes memory to, bytes memory data) external payable onlyNftMarket {
        require(msg.value >= fee, "Insufficient fee");
        emit MessageDispatched(toChainId, to, data, msg.value);
    }

    function registerCustomVerifier(address verifier) external onlyNftMarket {
        emit CustomVerifierRegistered(verifier);
    }

    function inboundCall(bytes memory data, uint256 networkId, bytes memory from) external {
        bytes memory functionCallData = abi.encodeWithSelector(NftMarket(payable(nftMarket)).wmbReceive.selector, data);
        bytes memory packedData = NftMarket(payable(nftMarket)).encodeAuthParamsBytes(networkId, from, functionCallData);
        Address.functionCall(nftMarket, packedData);
    }

    function addressToBytes(address addr) public pure returns (bytes memory) {
        bytes memory tempBytes = new bytes(20);
        assembly {
            mstore(add(tempBytes, 0x20), shl(96, addr))
        }
        return tempBytes;
    }

    function setFee(uint256 _fee) external {
        fee = _fee;
    }
}
