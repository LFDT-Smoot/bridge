## Smoot: An Open Source Project for DLT Interoperability 


# Abstract

This mission of project Smoot is to build an open source bridge for chain-to-chain interactions, based on the Enterprise Ethereum Alliance (EEA)’s DLT Interoperability Specification, as an open source project for the Linux Foundation’s Decentralized Trust(LFDT).

# Context

The EEA's DLT Interoperability Specification is a standard developed by members of the Enterprise Ethereum Alliance. Several implementations have been created to connect different blockchains based on this specification, including those by Wanchain, Adhara, QualitaX, and Fnality. We aim to develop an open-source project for implementing bridges that build interoperable components connecting both EVM and non-EVM blockchains.

# Dependent Projects

The Smoot project team intends to leverage technologies developed by LFDT, such as Cacti, Harmonia, and Besu EVM projects:

* Besu   
  Besu has been a popular EVM client node for both public and private blockchains. Besu was initially an implementation of the Enterprise Ethereum Alliance (EEA) Client Architecture and runs on both public and private networks. Project Smoot has a scope of work to connect to networks built with Besu clients.  
    
* Harmonia, a Hyperledger Lab  
  Harmonia implements the Enterprise Ethereum Alliance's DLT Interoperability Specification's transaction messaging methods. Project Smoot will focus on implementing the event messaging method. The Smoot team will also explore the possibility of combining Project Smoot with Harmonia.  
    
* Hyperledger Cacti  
  Cacti is an interoperability project that builds routing mechanisms for cross-chain minting and burning of assets. There are some common components that can be developed with various interoperability projects. For example, the cross-chain network identifier can be standardized so that different projects can use the same specification for blockchain identities.

# Motivation

The motivation for Project Smoot stems from the need to build a modular, reusable, and vendor-agnostic chain-to-chain framework based on the DLT Interoperability Specification developed by the Enterprise Ethereum Alliance (EEA). The EEA is a standards organization that builds standards through member efforts and leaves the implementation of standards to vendors. We aim to develop an open-source implementation and host the implementation source code in LFDT. The EEA’s Distributed Ledger Technology Interoperability Specification aims to establish a secure and efficient framework for interoperability between different blockchain networks, focusing on enterprise applications.

# Solution

**Smoot Architecture**  
The architecture of Smoot is composed of three layers: the Messaging Layer, the Function Calls Layer, and the Application Layer.

* The Crosschain Messaging Layer facilitates the secure exchange of data and events between networks, ensuring the integrity and validity of information passing between them. This is the communication backbone, ensuring that events generated on one network can be trusted on another. This layer is foundational to the trustless nature of DLTs, providing the mechanisms for verification and validation of events across different networks without the need for a centralized authority.  
* The Crosschain Function Calls Layer enables the execution of operations across networks, allowing cross-chain applications to trigger and coordinate activities on multiple networks. This is the operational core of the stack, enabling functions to be executed remotely on another network. This capability is crucial for allowing synchronous workflows across networks in scenarios where actions on one network depend on the state or outcomes on another. It is this layer that orchestrates the remote execution of smart contract functions, ensuring that transactions are not only executed but done so in a manner that aligns with the overarching business logic defined in the Applications Layer.  
* The Crosschain Applications Layer harbors business logic and use case-specific functionality. This is where the complex operations of enterprise applications are defined and managed.  


**Smoot workflow**  
In a typical cross-blockchain transaction, a user sends a request to the application layer. This request could be a transfer of fungible or non-fungible tokens from a source chain to a target chain, or a request to sell an asset to users who can pay with assets in another blockchain. The application layer receives the request and packages a transaction to send to the source chain. The source chain processes the transaction and emits an event to signal that the transaction in the source chain is completed. The messaging and functional call layer then verifies and signs the event. The messaging layer can also package a target transaction and send it to the target chain to execute the functions in the target chain’s smart contract.

Once the transaction is completed in the target chain, a confirmation message can be sent to the application layer to inform the status of the cross-chain transactions. 


**Smoot deliverables**  
The Smoot team will implement the architecture and workflow and deliver the following reusable components

* Various layering mechanisms including Multisig relay, MPC relay, and ZKP relay

  **Multisig relay:** a mechanism that leverages multi-signature consensus for relaying messages across blockchains. In this approach, the message originating from a source chain is cryptographically signed by multiple independent relay nodes. These relay nodes or validators have public key signatures that are registered and verified against a whitelist of trusted nodes maintained on the target chain's smart contract. The relay nodes' signatures on the message are aggregated and attached to the communication payload sent from the source chain to the smart contract on the target chain.


  **MPC (Multi-Party Computing) relay:** A mechanism that differs from multisig in that it involves only a single relay address affiliated with the relaying activity between networks. This relay address does not have access to the full private key; instead, the private key is shared into segments and distributed in a cryptographically secure manner among a set of MPC nodes. These nodes engage in secure multi-party computation protocols to jointly sign messages sent from the relay address without any node revealing its share of the private key.


  **ZKP (Zero Knowledge Proof) relay:** a mechanism that utilizes modern cryptographic proof constructions to validate integrity of crosschain messages without revealing actual content.


  The Smoot team will also explore other messaging mechanisms such as Oracle, light clients, and hybrid methods.

   

* Smart contracts for source and target blockchains

  Smart contracts for both EVM and non-EVM blockchains will be implemented in compliance with the Enterprise Ethereum Alliance DLT Interoperability Specification. These smart contracts will have interfaces that define how to emit events, how to decode and verify events, and how to call functions on another blockchain.

   

* Relaying services

  An implementation of a relaying service will be provided. This relayer will constantly scan events on the source chain to identify any cross-chain transactions that need to be relayed. Once a cross-chain transaction is detected, the relayers will process the event and invoke functions on the target chain. The relayers will follow the same protocol when detecting and processing events.


* Sample applications and User interfaces

  Several sample cross-chain applications will be implemented, including Crosschain Asset Trading System, Crosschain Asset Transfer System, and Crosschain DEX. 


**Smoot development timeframe**

* Phase 1: Migration

  This project phase involves migrating the Wanchain implementation of EEA DLT Interoperability to the LFDT code repository. The new open-source code base will be designed as vendor-agnostic and will allow modular components to be added by community contributors.


* Phase 2: Convergence and Unification

  In this phase, the project team will explore the possibility of combining with other projects to add components such as Harmonia’s transaction-based relay and Cacti's connectors. The ZKP mechanism will also be added to Smoot messaging.

   

* Phase 3: Dissemination and Adoption

  In this phase, enterprise solutions based on the Smoot framework are built. End-to-end use cases, including application and GUI components, will be developed and added to the repository. Enterprises and developers can leverage the source code to build their cross-chain applications. Smoot infrastructure providers can also build frameworks to allow third-party developers to efficiently build applications leveraging common layers.


# Documentation, Github Actions, and Builds

The Smoot documentation, github actions, and builds will follow the best practice of LFDT:  
[https://lf-decentralized-trust.github.io/governance/guidelines/project-best-practices.html](https://lf-decentralized-trust.github.io/governance/guidelines/project-best-practices.html)

# EEA DLT Interoperability Specification

Project Smoot will be designed to be compliant with the EEA’s DLT Interoperability Specification. This specification addresses the need for various blockchain platforms to interact and transact seamlessly, especially in complex and regulated sectors like financial services and supply chain management. The specification includes architectural guidelines, protocol stack, and interface definitions, which are crucial for asset and data exchange across different blockchain systems, thereby enhancing their functionality and utility.

It is designed to support enterprise blockchain networks using diverse underlying technologies (for example, EVM and non-EVM networks), facilitating complex multi-chain ecosystem deployments involving assets, payments, and securities transactions. The open standard prevents fragmentation across different vendor implementations. Use cases include currency exchanges between blockchains with different tokens, coordinating securities transfers with payment transfers on different networks, and atomic swaps/transfers of digital assets. The specification aims to support regulated enterprise use cases that require interoperability between multiple blockchains with secure guarantees.

Currently DLT Interoperability Specification is hosted by EEA in its private repository.  The EEA Interoperability workgroup releases public review versions frequently. The current release version is located at the following location:  
[https://entethalliance.org/specs/dlt-interop/](https://entethalliance.org/specs/dlt-interop/)

An implementation of this version of DLT interoperability is located in the following github location:  
[https://github.com/wanchain/Stellar-EEA-Compliant-Interoperability](https://github.com/wanchain/Stellar-EEA-Compliant-Interoperability)

The Smoot project maintainers have access to EEA private repositories as members and subject matter experts. 

# Slack, Discord, or Telegram

The Smoot development team prefers using Telegram and emails for communications. Discord or Slack can also be considered.

# References

EEA DLT Interoperability Specification: [https://entethalliance.org/specs/dlt-interop/](https://entethalliance.org/specs/dlt-interop/)  


