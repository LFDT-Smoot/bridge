// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IWmbGateway.sol";
import "../utils/AuthParams.sol";

/**
 * @title WmbApp
 * @dev Abstract contract to be inherited by applications to use Wanchain Message Bridge for send and receive messages between different chains.
 * All interfaces with WmbGateway have been encapsulated, so users do not need to have any interaction with the WmbGateway contract.
 */
abstract contract WmbApp is OwnableUpgradeable, AuthParams {
    // The address of the WMB Gateway contract
    address public wmbGateway;

    // A mapping of remote chains and addresses that are trusted to send messages to this contract
    // fromChainId => fromAddress hash => trusted
    mapping (uint => mapping(address => bool)) public trustedRemotes;

    /**
     * @dev Initializes the contract with the given admin, WMB Gateway address, and block mode flag
     * @param admin Address of the contract admin
     * @param _wmbGateway Address of the WMB Gateway contract
     */
    function __WmbApp_initialize(address admin, address _wmbGateway) virtual public onlyInitializing {
        // Initialize the AccessControl module with the given admin
        __Ownable_init(admin);
        wmbGateway = _wmbGateway;
    }

    /**
     * @dev Function to set the trusted remote addresses
     * @param fromChainIds IDs of the chains the messages are from
     * @param froms Addresses of the contracts the messages are from
     * @param trusted Trusted flag
     * @notice This function can only be called by the admin
     */
    function setTrustedRemotesBytes(uint[] calldata fromChainIds, bytes[] calldata froms, bool[] calldata trusted) external onlyOwner {
        require(fromChainIds.length == froms.length && froms.length == trusted.length, "WmbApp: invalid input");
        for (uint i = 0; i < fromChainIds.length; i++) {
            trustedRemotes[fromChainIds[i]][toEthAddress(froms[i])] = trusted[i];
        }
    }

    function setTrustedRemotes(uint[] calldata fromChainIds, address[] calldata froms, bool[] calldata trusted) external onlyOwner {
        require(fromChainIds.length == froms.length && froms.length == trusted.length, "WmbApp: invalid input");
        for (uint i = 0; i < fromChainIds.length; i++) {
            trustedRemotes[fromChainIds[i]][froms[i]] = trusted[i];
        }
    }

    /**
     * @dev Function to estimate fee in native coin for sending a message to the WMB Gateway
     * @param toChain ID of the chain the message is to
     * @param gasLimit Gas limit for the message
     * @return fee Fee in native coin
     */
    function estimateFee(uint256 toChain, uint256 gasLimit) virtual public view returns (uint256) {
        return IWmbGateway(wmbGateway).estimateGas(toChain, gasLimit, "0x");
    }

    function wmbReceive(
        bytes calldata data
    ) virtual external {
        // Only the WMB gateway can call this function
        require(msg.sender == wmbGateway, "WmbApp: Only WMB gateway can call this function");
        (uint256 fromChainId, address from) = decodeAuthParams();
        require(trustedRemotes[fromChainId][from], "WmbApp: Remote is not trusted");
        _wmbReceive(data);
    }

    function _wmbReceive(
        bytes calldata data
    ) virtual internal;

    function outboundCall(
        uint toChainId,
        bytes memory to,
        bytes memory data,
        uint fee
    ) virtual internal {
        // generate function call data with function name hash
        bytes memory functionCallData = abi.encodeWithSelector(this.wmbReceive.selector, data);
        IWmbGateway(wmbGateway).outboundCall{value: fee}(toChainId, to, functionCallData);
    }
}
