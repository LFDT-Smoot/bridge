## eventModel fields overview



### Transaction & Chain Identifiers

- **`hashX`**: A unique hash identifying the cross-chain transaction.
- **`actionChain`**: The name of the destination chain.
- **`actionChainID`**: The ID of the destination chain.
- **`originChain`**: The name of the source (or origin) chain.
- **`originChainID`**: The ID of the source (or origin) chain.
- **`crossChain`**: The name of the destination chain. *(Note: This appears to be redundant with `actionChain`.)*
- **`crossChainID`**: The ID of the destination chain. *(Note: This appears to be redundant with `actionChainID`.)*

### Core Transaction Details

- **`from`**: The user's wallet address that initiated the transaction.
- **`crossScAddr`**: The smart contract address on the source chain that was called to initiate the transaction.
- **`crossAddress`**: The recipient's wallet address on the destination chain.
- **`value`**: The amount of tokens or assets being transferred.
- **`crossValue`**: The amount of assets being transferred. *(Note: This appears to be redundant with `value`.)*
- **`networkFee`**: The total network fee (e.g., gas) paid for the transaction.
- **`crossMode`**: The mode of the cross-chain transaction (e.g., 'SINGLE', 'BATCH').
- **`extData`**: A field for storing extra, miscellaneous data related to the transaction. Can be `null`.

### Status & Processing

- **`status`**: The current processing stage of the transaction (e.g., 'pending', 'confirmed', 'failed').
- **`transRetried`**: The number of times this transaction has been retried after a failure.
- **`transConfirmed`**: The number of block confirmations the transaction has received on the source chain.
- **`failAction`**: The specific step or action where the transaction failed.
- **`failReason`**: A detailed reason for the transaction failure.

### Source Chain Information

- **`blockNumber`**: The block number on the source chain where the transaction was initiated.
- **`timestamp`**: The timestamp (e.g., Unix epoch) when the transaction was initiated on the source chain.
- **`srcTransferEvent`**: An array of JSON objects representing the event(s) emitted by the source chain contract.

### Destination Chain Information

- **`destReceiveTxHash`**: The transaction hash of the corresponding 'receive' transaction on the destination chain.
- **`destReceiveTxBlockNumber`**: The block number on the destination chain where the 'receive' transaction was included.
- **`destReceiveEvent`**: The event data from the 'receive' transaction on the destination chain.
- **`actionTime`**: The timestamp when the 'receive' transaction was executed on the destination chain.

### Parsing & Flags

- **`isUnDecode`**: A boolean flag set to `true` if the initial event parsing failed.
- **`unDecodeEvent`**: The raw event data that could not be decoded.
- **`isUnDecodeDone`**: A flag indicating if a re-scan and re-decode attempt has been completed for a failed parse.
- **`isUpdateAction`**: A flag for a potential future action, which may be deprecated.