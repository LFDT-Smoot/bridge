// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./app/WmbApp.sol";

contract Token3643Home is WmbApp {
    using SafeERC20 for IERC20;

    struct MessageData {
        address to;
        uint256 amount;
    }

    address public tokenAddress;
    address public tokenRemote;
    uint256 public remoteChainId;

    event SendTokenToRemote(
        uint256 indexed toChainId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event ReceiveTokenFromRemote(
        uint256 indexed fromChainId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event ConfigTokenRemote(address tokenRemote);


    function initialize(
        address _admin,
        address _wmbGateway,
        address _tokenAddress
    ) public initializer {
        tokenAddress = _tokenAddress;
        __WmbApp_initialize(_admin, _wmbGateway);
    }


    function configTokenRemote(uint256 _remoteChainId, address _tokenRemote) external onlyOwner {
        tokenRemote = _tokenRemote;
        remoteChainId = _remoteChainId;

        setTrustedRemote(remoteChainId, tokenRemote, true);
        emit ConfigTokenRemote(tokenRemote);
    }

    function send(address to, uint256 amount) external {
        require(tokenRemote != address(0), "tokenRemote not set");
        require(amount > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid receiver address");

        uint balance = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        uint newBalance = IERC20(tokenAddress).balanceOf(address(this));
        uint receivedAmount = newBalance - balance;

        require(receivedAmount == amount, "Token transfer failed");

        MessageData memory msgInfo;
        msgInfo.to = to;
        msgInfo.amount = receivedAmount;

        outboundCall(
            remoteChainId,
            abi.encodePacked(tokenRemote),
            abi.encode(msgInfo),
            estimateFee(remoteChainId, 300_000)
        );

        emit SendTokenToRemote(remoteChainId, msg.sender, to, receivedAmount);
    }

    function _wmbReceive(
        bytes calldata data
    ) internal override {

        MessageData memory messageData = abi.decode(data, (MessageData));
        IERC20(tokenAddress).safeTransfer(messageData.to, messageData.amount);

        emit ReceiveTokenFromRemote(remoteChainId, tokenAddress, messageData.to, messageData.amount);
    }
}
