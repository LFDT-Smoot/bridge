// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./app/WmbApp.sol";

contract NftMarket is ReentrancyGuardUpgradeable, ERC721EnumerableUpgradeable, ERC721Holder, WmbApp {
    using SafeERC20 for IERC20;

    struct MessageData {
        string messageType; // "CreateOrder", "CancelOrder", "CancelSuccess", "CancelFail", "OrderSuccess"，"UnlockNFT"
        bytes nftContract;
        uint256 nftId;
        address priceToken;
        uint256 price;
        address recipient;
        bytes buyer;
    }

    struct OrderInfo {
        MessageData messageData;
    }

    struct StellarNFT {
        bytes nftContract;
        uint256 nftId;
    }

    uint256 public totalMinted;
    uint256 public stellarBip44ChainId;
    bytes public stellarContract;

    bytes32[] public orderKeys;

    mapping(uint256 => StellarNFT) public stellarNFTs; // tokenId => StellarNFT
    mapping(bytes32 => OrderInfo) public orderInfos; // orderKey:keccak256(nftContract, nftId, priceToken, recipient) => OrderInfo

    event OrderCreated(MessageData messageData);
    event OrderCancelledSuccess(MessageData messageData);
    event OrderCancelledFailed(MessageData messageData);
    event BuyOrder(bytes32 indexed orderKey, address indexed buyer, bytes nftContract, uint256 nftId, address priceToken, uint256 price, address recipient);
    event UnwrapNFT(uint256 tokenId, bytes receiver, bytes nftContract, uint256 nftId);
    event MintWrappedNFT(address to, uint tokenId, bytes stellarNFTContract, uint256 stellarNFTId);

    function initialize(address admin, address gateway, uint256 _stellarBip44ChainId, bytes memory _stellarContract) public initializer {
        string memory name = "Wrapped Stellar NFT";
        string memory symbol = "WSNFT";
        stellarBip44ChainId = _stellarBip44ChainId;
        stellarContract = _stellarContract;
        __ERC721_init(name, symbol);
        __ERC721Enumerable_init();
        __WmbApp_initialize(admin, gateway);
    }

    // receive MATIC for message bridge fee
    receive() external payable {}

    function buyOrder(bytes32 orderKey) external payable nonReentrant {
        OrderInfo memory order = orderInfos[orderKey];
        require(order.messageData.price > 0, "NftMarket: order not exist");
        
        uint fee = estimateFee(stellarBip44ChainId, 300_000);
        if (order.messageData.priceToken == address(0)) {
            require(msg.value == order.messageData.price + fee, "NftMarket: invalid price");
            Address.sendValue(payable(order.messageData.recipient), order.messageData.price);
        } else {
            require(msg.value == fee, "NftMarket: invalid fee value");
            IERC20(order.messageData.priceToken).safeTransferFrom(msg.sender, order.messageData.recipient, order.messageData.price);
        }

        mintWrappedNFT(order.messageData, msg.sender);
        
        // send order success message
        order.messageData.messageType = "OrderSuccess";
        outboundCall(
            stellarBip44ChainId, 
            stellarContract,
            abi.encode(order.messageData),
            fee
        );

        emit BuyOrder(orderKey, msg.sender, order.messageData.nftContract, order.messageData.nftId, order.messageData.priceToken, order.messageData.price, order.messageData.recipient);
        require(_removeOrder(orderKey), "NftMarket: invalid order key");
    }

    function orderCount() external view returns (uint256) {
        return orderKeys.length;
    }

    function getAllOrders() external view returns (bytes32[] memory, OrderInfo[] memory) {
        return getOrderInfoByRange(0, orderKeys.length);
    }

    function getOrderInfoByRange(uint256 start, uint256 end) public view returns (bytes32[] memory, OrderInfo[] memory) {
        require(start < end, "NftMarket: invalid range");
        require(end <= orderKeys.length, "NftMarket: out of range");
        OrderInfo[] memory orderInfosRange = new OrderInfo[](end - start);
        bytes32[] memory tmpOrderKeys = new bytes32[](end - start);
        for (uint i = start; i < end; i++) {
            orderInfosRange[i - start] = orderInfos[orderKeys[i]];
            tmpOrderKeys[i - start] = orderKeys[i];
        }
        return (tmpOrderKeys, orderInfosRange);
    }

    // use default transfer receive function for cross-chain unwrap NFT
    // must fill stellar wallet address in data for receive the unlock NFT
    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        require(_msgSender() == address(this), "NftMarket: invalid receiver");
        require(data.length >= 20, "NftMarket: invalid unwrap receiver address");
        burn(tokenId);

        StellarNFT memory stellarNFT = stellarNFTs[tokenId];
        // send unlock NFT message
        outboundCall(
            stellarBip44ChainId, 
            stellarContract,
            abi.encode(MessageData(
                "UnlockNFT",
                stellarNFT.nftContract,
                stellarNFT.nftId,
                address(0),
                0,
                address(0),
                data // buyer address
            )),
            estimateFee(stellarBip44ChainId, 300_000)
        );

        emit UnwrapNFT(tokenId, data, stellarNFT.nftContract, stellarNFT.nftId);
        return this.onERC721Received.selector;
    }

    function _wmbReceive(
        bytes calldata data
    ) override internal {
        MessageData memory messageData = abi.decode(data, (MessageData));
        if (keccak256(bytes(messageData.messageType)) == keccak256("CreateOrder")) {
            createOrder(messageData);
        } else if (keccak256(bytes(messageData.messageType)) == keccak256("CancelOrder")) {
            cancelOrder(messageData);
        } else {
            revert("NftMarket: invalid message type");
        }
    }

    function createOrder(MessageData memory messageData) internal {
        require(messageData.price > 0, "NftMarket: invalid price");
        require(messageData.recipient != address(0), "NftMarket: invalid recipient");
        require(messageData.nftId > 0, "NftMarket: invalid nftId");
        require(messageData.nftContract.length > 0, "NftMarket: invalid nftContract");
        OrderInfo memory orderInfo = OrderInfo({
            messageData: messageData
        });
        bytes32 orderKey = keccak256(abi.encodePacked(messageData.nftContract, messageData.nftId, messageData.priceToken, messageData.recipient));
        orderKeys.push(orderKey);
        orderInfos[orderKey] = orderInfo;
        emit OrderCreated(messageData);
    }

    function cancelOrder(MessageData memory messageData) internal {
        bytes32 orderKey = keccak256(abi.encodePacked(messageData.nftContract, messageData.nftId, messageData.priceToken, messageData.recipient));

        if (_removeOrder(orderKey)) {
            // send order cancel success message
            messageData.messageType = "CancelSuccess";

            uint fee = estimateFee(stellarBip44ChainId, 300_000);
            outboundCall(
                stellarBip44ChainId, 
                stellarContract,
                abi.encode(messageData),
                fee
            );

            emit OrderCancelledSuccess(messageData);
        } else {
            // cancel fail do not send message
            messageData.messageType = "CancelFail";
            emit OrderCancelledFailed(messageData);
        }
    }

    function _removeOrder(bytes32 orderKey) internal returns(bool) {
        uint i = 0;
        bool found = false;
        for (i = 0; i<orderKeys.length; i++) {
            if (orderKeys[i] == orderKey) {
                found = true;
                break;
            }
        }

        if (found) {
            orderKeys[i] = orderKeys[orderKeys.length - 1];
            orderKeys.pop();
            delete orderInfos[orderKey];
            return true;
        }
        return false;
    }

    function mintWrappedNFT(MessageData memory messageData, address _to) internal {
        require(messageData.nftId > 0, "NftMarket: invalid nftId");
        require(messageData.nftContract.length > 0, "NftMarket: invalid nftContract");

        uint256 tokenId = totalMinted + 1;
        _mint(_to, tokenId);
        stellarNFTs[tokenId] = StellarNFT({
            nftContract: messageData.nftContract,
            nftId: messageData.nftId
        });
        totalMinted++;

        emit MintWrappedNFT(_to, tokenId, messageData.nftContract, messageData.nftId);
    }

    function getEncode(MessageData memory messageData) public pure returns (bytes memory) {
        return abi.encode(messageData);
    }

    function burn(uint256 tokenId) internal {
        _update(address(0), tokenId, _msgSender());
    }

    function withdrawFee(address _to) external onlyOwner {
        payable(_to).transfer(address(this).balance);
    }

    function updateStellarChainId(uint256 _stellarBip44ChainId) external onlyOwner {
        stellarBip44ChainId = _stellarBip44ChainId;
    }

    function updateStellarContract(bytes memory _stellarContract) external onlyOwner {
        stellarContract = _stellarContract;
    }

    function encodeData(MessageData memory messageData) public pure returns (bytes memory) {
        return abi.encode(messageData);
    }

    function decodeData(bytes memory data) public pure returns (MessageData memory) {
        return abi.decode(data, (MessageData));
    }
}