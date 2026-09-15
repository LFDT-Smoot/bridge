# SMOOT-Bridge Architecture Document

## 1. Executive Summary & System Vision

**SMOOT-Bridge** is a decentralized, modular cross-chain interoperability protocol developed under the Linux Foundation Decentralized Trust (LFDT) / Hyperledger Cacti ecosystem. It provides generic, secure, and bidirectional message passing and asset transfer across heterogeneous blockchain environments, seamlessly bridging **EVM-compatible networks** (such as Ethereum and Polygon) and **non-EVM networks** (specifically Stellar / Soroban).

The protocol is architected around the **Web3 Message Bus (WMB)** paradigm, decoupling application-level cross-chain intent from the underlying verification, attestation, and transport layers. While the flagship application implements compliant **ERC-3643 security token** and **ERC-20** transfers via a Lock-and-Mint / Burn-and-Unlock pattern, the architecture also natively powers **cross-chain NFT trading** and **arbitrary cross-chain smart contract function execution**.

---

## 2. High-Level System Architecture

The SMOOT-Bridge platform is structured into five cohesive tiers:

```
+-----------------------------------------------------------------------------------+
|                            1. DApp & Presentation Tier                            |
|     [app_bridge_ui] (React)             [app_nftMarket] (React)                   |
|     (EVM MetaMask / Stellar Freighter)  (Cross-Chain NFT Orderbook & Minting)     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        2. Backend Indexing & Routing Tier                         |
|     [routeService_multiSig]             [scanService_nftMarket]                   |
|     - REST API / Multi-Sig Aggregator   - Chain Indexer (Polygon EVM + Soroban)   |
|     - Secp256k1 & Ed25519 Verification  - MongoDB Persistence / State Sync        |
+-----------------------------------------------------------------------------------+
                                         ^
                                         |
+-----------------------------------------------------------------------------------+
|                         3. Off-Chain Agent / Relayer Tier                         |
|     [cross-route Agent Network] (Node.js)                                         |
|     - Leader vs. Follower Consensus Role Partitioning                             |
|     - ChainSync Monitors (Block pollers, Event Filters)                           |
|     - Converters (Gateway & DApp Payload Encoders/Decoders)                       |
|     - Attestation Submissions & Inbound Execution Drivers                         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        4. Verification & Attestation Tier                         |
|     [Multi-Sig Threshold Committee]     [Merkle Proof Engine]                     |
|     - M-of-N Signature Schemes          - InteropManager / ValidatorSetManager    |
|     - Threshold Curve Support           - State Root & Receipt Inclusion Proofs   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         5. On-Chain Smart Contract Tier                           |
|  [Ethereum (Home)]       [Polygon (Remote)]          [Stellar / Soroban]          |
|  - WmbGateway.sol        - WmbGateway.sol            - message_bridge (Rust)      |
|  - TokenHome.sol         - TokenRemote.sol           - nft_market & nft           |
|  - ERC-3643 / T-REX      - NFTMarket / ERC-721       - Secp256k1Pubkey / Verifier |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Subsystem Breakdown

### 3.1 On-Chain Smart Contract Architecture (`contracts/`)

The repository partitions smart contract implementations across chain ecosystems while maintaining unified messaging semantics.

#### A. EVM Message Bridge Contracts (`contracts_ethereum` & `contracts_polygon`)
Both Ethereum and Polygon deploy the core **WMB Gateway** architecture:
- **`WmbGateway.sol`**:
  - Implements `IWmbGateway` for outbound calls and invokes `IWmbReceiver` for inbound calls.
  - **`outboundCall(uint256 targetChainId, address targetContract, bytes messageData)`**:
    - Calculates required message fee based on destination chain gas configurations.
    - Increments the account/gateway nonce to guarantee replay prevention across chains.
    - Computes a unique `messageId` binding `(sourceChainId, nonce, sender, targetChainId, targetContract, messageData)`.
    - Emits event: `WMBMessage(bytes32 indexed messageId, uint256 sourceChainId, address indexed sender, uint256 indexed targetChainId, address targetContract, bytes messageData)`.
  - **`inboundCall(bytes messageData, bytes signature)`**:
    - Verifies relayer authorization or cryptographic multi-signature attestation against registered signers.
    - Enforces idempotency: maintains `mapping(bytes32 => bool) public executedMessages`.
    - Dispatches payload via interface call: `IWmbReceiver(targetContract).wmbReceive(messageData, messageId, sourceChainId, sender)`.

#### B. Token Contracts (`TokenHome` & `TokenRemote`)
- **`TokenHome.sol` (Ethereum)**:
  - Acts as the primary custody vault for original tokens.
  - Interacts with permissioned **ERC-3643** identity compliance systems (ONCHAINID, Identity Registry, Compliance modules).
  - Handles `send(uint256 targetChainId, address recipient, uint256 amount)`:
    - Verifies sender eligibility and compliance rules.
    - Locks tokens within the `TokenHome` contract.
    - Triggers `WmbGateway.outboundCall` targeting the corresponding `TokenRemote` address on the destination chain.
  - Handles `wmbReceive` during return trips to unlock and transfer original tokens back to the user.
- **`TokenRemote.sol` (Polygon)**:
  - Deployed on remote chains to represent mapped/wrapped assets.
  - When receiving `wmbReceive` triggered by `WmbGateway.inboundCall`:
    - Decodes incoming payload `(recipient, amount, originalSender)`.
    - Executes `mint(recipient, amount)` for the user.
  - When user transfers back to Home chain:
    - Executes `burn(sender, amount)`.
    - Calls `WmbGateway.outboundCall` targeting `TokenHome` on Ethereum.

#### C. Soroban Smart Contracts (`contracts_soroban`)
Written in Rust targeting the Stellar Soroban WASM runtime:
- **`message_bridge`**:
  - **`contract.rs`**: Core entry point handling initialization, admin governance, and message verification.
  - **`cross_chain_verifier.rs` & `Secp256k1Pubkey.rs`**: Verifies secp256k1 threshold signatures directly on Soroban using native cryptographic host functions.
  - **`nonce.rs` & `MessageExecuted.rs`**: Storage layout keys tracking cross-chain nonces and executed message hashes to safeguard against replay attacks.
  - **`threshold.rs`**: Configurable $M$-of-$N$ threshold logic for cross-chain validator committees.
- **`nft` & `nft_market`**:
  - Implementation of Soroban-native NFT asset storage and marketplace mechanics supporting cross-chain purchase triggers and inventory locking.

#### D. Merkle Proof Interoperability Layer (`contracts_merkle_proofs`)
Provides an alternative enterprise-grade verification pipeline based on cryptographic state proofs:
- **`InteropManager.sol`**: Central orchestrator registering partner chain validator sets, processing Merkle roots, and verifying inclusion proofs.
- **`ValidatorSetManager.sol`**: Tracks epochs, validator transitions, and signature thresholds of source chain consensus bodies.
- **`CrosschainMessaging.sol` & `CrosschainFunctionCall.sol`**: Encapsulates state-proof validated function execution.

---

### 3.2 Off-Chain Relayer Agent Network (`agent/`)

The off-chain agent (named `cross-route`) is built on a modular Node.js framework (`agent/framework/` and `agent/modules/`).

#### A. Node Architecture & Roles
The agent network operates in an active-passive or leader-follower topology:
1. **Leader Agent (`--leader`)**:
   - Executes `syncMain`: Scans configured source chains at scheduled intervals (`sync_interval_time`).
   - Executes `handlerMain` -> `monitorHandler`: Queries pending cross-chain transactions from the database, obtains threshold approvals from the multi-sig service, prepares the transaction payload for the target chain, and submits `inboundCall`.
2. **Follower / Validator Agent (non-leader)**:
   - Also runs `syncMain` to independently construct local state.
   - Executes `syncRelayRequest`: Polls `routeService_multiSig` for pending relay requests (`multiSig.getForApprove()`).
   - Verifies the requested relay data against its local database and source chain RPC (`crossAgent.checkRelayData()`).
   - If verified, creates a cryptographic signature over the payload and submits it to the routing service (`multiSig.approve()`).

#### B. Core Agent Abstractions & Pipeline
- **`chainSync.js`**:
  - Periodically checks chain tip, retrieves block ranges, queries `WMBMessage` event logs, parses payload structures, and persists records into MongoDB with state transitions: `Init` -> `Signed` -> `Relaying` -> `Done` (or `Failed`).
- **Gateway & DApp Converters (`framework/converter/` & `modules/converter/`)**:
  - **`gateway_convert_abstract.js`**: Standardizes chain-level gateway event decoding across heterogeneous chains (EVM ABI decoding vs. Soroban XDR decoding).
  - **`wmbapp_convert_abstract.js`**: Application-level decoders (e.g., extracting token amounts, receiver addresses, or NFT token IDs from raw message bytes).
- **Wallet & Chain Modules (`modules/chain/` & `modules/wallet/`)**:
  - Concrete drivers for `EVM` (Web3 / Ethers) and `Stellar` (Stellar SDK, Soroban RPC, Keypair management).

---

### 3.3 Multi-Signature Routing Service (`services/routeService_multiSig/`)

A dedicated microservice providing threshold signature coordination and attestation management:

- **Technology Stack**: Node.js, Express, MongoDB.
- **Key Responsibilities**:
  1. **Message Registry**: Stores cross-chain dispatch intents and accumulates validator attestations.
  2. **Multi-Curve Signature Verification**:
     - **`secp256k1Service.js`**: Recovers public keys from ECDSA signatures on EVM-bound messages and Soroban secp256k1 verification hashes.
     - **`ed25519Service.js`**: Verifies Ed25519 signatures for Stellar-bound commands.
  3. **Threshold Enforcement**:
     - Evaluates whether collected valid signatures meet the configured threshold `M`.
     - Once threshold is met, marks the message ready for relay by the leader node.

---

### 3.4 NFT Market Scanner Service (`services/scanService_nftMarket/`)

A real-time indexer service that synchronizes cross-chain NFT state between Polygon EVM and Stellar Soroban:

- **Technology Stack**: Node.js, Web3.js, Stellar-SDK, MongoDB.
- **Workflow**:
  1. **Dual-Chain Polling**: Concurrently runs `scanPolygonService` and `scanStellarService`.
  2. **Event Parsing**: Monitors NFT mints, transfers, listings, price changes, and cross-chain purchases.
  3. **Unified REST API (`restApiService.js`)**: Serves market data, NFT ownership records, and cross-chain execution statuses to `app_nftMarket`.

---

### 3.5 Frontend Applications (`apps/`)

- **`app_bridge_ui/`**:
  - Production-ready React application for cross-chain token transfers.
  - Integrates Web3 providers for EVM (MetaMask, WalletConnect) and Stellar (Freighter wallet extension).
  - Dynamically builds cross-chain parameters, displays approval/allowance prompts, tracks bridge confirmation status across source and target chains.
- **`app_nftMarket/`**:
  - Interactive marketplace frontend for browsing, buying, and listing NFTs across Polygon and Stellar.
- **`app_erc3643/`**:
  - Reference implementation and legacy interface for ERC-3643 permissioned token identity verification and bridge management.

---

## 4. End-to-End Execution Workflows

### 4.1 Token Lock and Mint Workflow (Ethereum -> Polygon)

```
User               TokenHome           WmbGateway(ETH)        Agent Network     MultiSig Service     WmbGateway(Polygon)    TokenRemote
 |                     |                     |                      |                  |                      |                  |
 |--- 1. send() ------>|                     |                      |                  |                      |                  |
 |    (Lock Token)     |--- 2. outboundCall()|                      |                  |                      |                  |
 |                     |    (emit WMBMessage)|                      |                  |                      |                  |
 |                     |                     |--- 3. Event Poll --->|                  |                      |                  |
 |                     |                     |    (SyncChain)       |--- 4. Register ->|                      |                  |
 |                     |                     |                      |<-- 5. Poll ------|                      |                  |
 |                     |                     |                      |    (Followers)   |                      |                  |
 |                     |                     |                      |--- 6. Sign & ---->|                      |                  |
 |                     |                     |                      |    Approve       |                      |                  |
 |                     |                     |                      |                  |                      |                  |
 |                     |                     |                      |<-- 7. Threshold -|                      |                  |
 |                     |                     |                      |    Attestation   |                      |                  |
 |                     |                     |                      |--- 8. inboundCall(proof, msg) --------->|                  |
 |                     |                     |                      |    (Leader)                             |--- 9. wmbReceive>|
 |                     |                     |                      |                                         |    (Mint Token)  |
```

1. **Initiation**: User invokes `TokenHome.send(...)` on Ethereum.
2. **Locking**: `TokenHome` verifies identity compliance and transfers the user's ERC-3643/ERC-20 tokens into contract custody.
3. **Dispatch**: `TokenHome` calls `WmbGateway.outboundCall(...)`, emitting a `WMBMessage` with unique `messageId` and payload.
4. **Ingestion**: Agent network `chainSync` captures the event and records it in MongoDB.
5. **Attestation Collection**:
   - The message is posted to `routeService_multiSig`.
   - Independent follower agents inspect the transaction on Ethereum, verify validity, and submit signatures.
6. **Threshold Reached**: When $M$-of-$N$ valid signatures are accumulated, the routing service marks the request verified.
7. **Relay & Execution**:
   - The leader agent submits `WmbGateway.inboundCall(...)` on Polygon.
   - Polygon's `WmbGateway` verifies signatures and replay nonce, then invokes `TokenRemote.wmbReceive(...)`.
8. **Minting**: `TokenRemote` mints wrapped tokens to the destination recipient address.

---

### 4.2 Cross-Chain NFT Trading Workflow (Polygon <-> Stellar)

1. An NFT is minted or listed on Polygon via `nft-market-contracts`.
2. A buyer on Stellar (using `app_nftMarket` and Freighter) initiates a cross-chain purchase transaction on Soroban's `nft_market`.
3. Soroban's `message_bridge` verifies funds and dispatches an outbound cross-chain purchase message.
4. The SMOOT-Bridge Agent network detects the Soroban transaction, transforms XDR data via `modules/chain/stellar`, and routes it through `routeService_multiSig`.
5. Once attested, the leader agent calls the Polygon bridge gateway, which instructs the Polygon NFT marketplace contract to settle and transfer the NFT to the buyer's mapped EVM address.
6. `scanService_nftMarket` indexes the state updates on both chains and refreshes the marketplace UI in real time.

---

## 5. Security Architecture & Design Mechanisms

| Mechanism | Implementation Location | Description |
| :--- | :--- | :--- |
| **Replay Attack Prevention** | `WmbGateway.sol`, `message_bridge/src/nonce.rs`, `MessageExecuted.rs` | Monotonically increasing outbound nonces per sender/contract combined with unique `messageId` hash tracking (`executedMessages` mapping / storage flags). |
| **Threshold Cryptography** | `routeService_multiSig`, `message_bridge/src/cross_chain_verifier.rs` | $M$-of-$N$ committee signature aggregation supporting Secp256k1 (EVM & Soroban) and Ed25519 (Stellar) keys. |
| **Leader/Follower Separation** | `agent/index.js`, `agent/framework/` | Decouples transaction execution (leader only) from independent validation and attestation (all followers), preventing front-running and unauthorized execution. |
| **Cryptographic State Proofs** | `contracts/contracts_merkle_proofs` | Merkle Patricia inclusion proofs verified against registered validator set consensus roots (`InteropManager.sol`). |
| **Permissioned Compliance** | `contracts_ethereum/token-contracts` | Full ERC-3643 / T-REX suite support ensuring cross-chain asset transfers preserve ONCHAINID identity and regulatory eligibility checks. |
| **Extensible Converter Pattern** | `agent/framework/converter/` | Strict separation of transport-level gateway framing from application-level payload serialization, allowing new DApps to plug in without modifying core bridge logic. |

---

## 6. Repository Directory Structure Reference

```
bridge/
├── agent/                          # Off-chain relayer node (cross-route)
│   ├── framework/                  # Core runtime engine, context, monitor, and abstract classes
│   └── modules/                    # Concrete chain adapters (EVM, Stellar), converters, and wallets
├── apps/                           # User-facing applications
│   ├── app_bridge_ui/              # React cross-chain asset bridge interface (EVM + Stellar)
│   ├── app_nftMarket/              # Cross-chain NFT marketplace interface
│   └── app_erc3643/                # Legacy ERC-3643 compliance interface
├── contracts/                      # Multi-chain smart contract suites
│   ├── contracts_ethereum/         # Ethereum WmbGateway, TokenHome, and ERC-3643 contracts
│   ├── contracts_polygon/          # Polygon WmbGateway, TokenRemote, and NFT contracts
│   ├── contracts_soroban/          # Stellar Soroban Rust contracts (message_bridge, nft, market)
│   └── contracts_merkle_proofs/    # Merkle proof & validator set verification contracts
├── deployment/                     # Deployment configurations and Dockerfiles
├── design/                         # Architecture and design documentation
├── docs/                           # Event models, guides, and tutorials
├── services/                       # Supporting backend microservices
│   ├── routeService_multiSig/      # Multi-signature coordination and signature verification service
│   └── scanService_nftMarket/      # Dual-chain NFT marketplace indexer and REST API
└── test/                           # Integration and end-to-end testing scaffolding
```

---

## 7. Conclusion

SMOOT-Bridge delivers a flexible, secure, and chain-agnostic message passing framework. By cleanly separating on-chain gateway dispatchers, off-chain modular agent pipelines, and flexible verification layers (threshold multi-signatures and Merkle state proofs), the architecture effectively bridges traditional EVM ecosystems with modern WASM-based execution environments like Stellar Soroban.
