# Smoot

Welcome to **Smoot**, an open-source cross-chain interoperability framework under the [Linux Foundation Decentralized Trust (LFDT)](https://www.lfdecentralizedtrust.org). Smoot provides a modular, extensible bridge infrastructure for transferring assets and data across heterogeneous blockchain networks.

<!-- TODO: Add a project banner image here -->
<!-- ![Smoot Banner](link-to-banner-image) -->

## What is Smoot?

Built with care by the [Wanchain](https://www.wanchain.org/) team and released to the open source community, Smoot is a modular, reusable, vendor-agnostic interoperability framework for homogeneous and heterogeneous chain-to-chain interactions. Compliant with the Enterprise Ethereum Alliance (EEA)’s DLT Interoperability Specification, Smoot reflects a shared vision for a more open and connected decentralized future.

Smoot's architecture is organized into distinct layers:

- **The Smoot Messaging Layer** – The Smoot Messaging Layer facilitates the secure exchange of data between distinct decentralized networks while ensuring data integrity and validity at every step.
- **The Smoot Function Call Layer** – The Smoot Function Call Layer enables the uninterrupted execution of operations across multiple distinct decentralized networks, removing barriers between chains.
- **The Smoot Application Layer** – The Smoot Application Layer orchestrates complex logic and workflows across distinct decentralized networks, unlocking unified cross-chain experiences. 

You can read more about it [here] (https://www.lfdecentralizedtrust.org/blog/meet-smoot-one-framework-to-connect-all-chains)

## Supported Standards

Smoot currently supports the following token standards and integration targets:

| Standard / Integration | Status | Notes |
|---|---|---|
| ERC20 | Supported | Fungible token transfers through the bridge framework |
| ERC721 | Supported | NFT transfer support |
| ERC3643 | Supported | Permissioned token support; implemented in a way that is compatible with ERC20-style interactions |

Additional standards and chain integrations may be added based on roadmap priorities, community demand, and partner contributions.


## Repository Guide

| Repository | Description |
|---|---|
| [**bridge**](https://github.com/LFDT-Smoot/bridge) | The core bridge implementation — smart contracts, relay agents, SDKs, application interfaces, deployment scripts, and tests. This is where the main development happens. |
| [**governance**](https://github.com/LFDT-Smoot/governance) | Project governance documents including the [Smoot Technical Charter](https://github.com/LFDT-Smoot/governance/blob/main/Smoot%20Technical%20Charter%20Final%204-17-2025.md), configuration files, and the project license. |

### Inside the `bridge` Repository

| Directory | Purpose |
|---|---|
| `apps/` | Front-end application and GUI for end users |
| `contracts/` | On-chain smart contracts (Solidity, Rust) |
| `agent/` | Off-chain relay/agent services |
| `sdks/` | Developer SDKs for programmatic bridge interaction |
| `services/` | Supporting backend services |
| `deployment/` | Deployment scripts and infrastructure configuration |
| `design/` | Architecture and design documents |
| `docs/` | Project documentation |
| `requirement/` | Requirements and specifications |
| `test/` | Test suites and testing utilities |

## Getting Started

<!-- TODO: Replace with actual getting-started steps once documentation is ready -->

1. **Explore the architecture** — Review the design documents in [`bridge/design/`](https://github.com/LFDT-Smoot/bridge/tree/main/design) and the docs in [`bridge/docs/`](https://github.com/LFDT-Smoot/bridge/tree/main/docs) to understand how Smoot works.
2. **Set up locally** — Clone the [bridge](https://github.com/LFDT-Smoot/bridge) repository and follow the setup instructions in the README.
3. **Try the examples** — XYZ directory demonstrates end-to-end cross-chain transfers. <!-- TODO: are there examples here? --> 

## Roadmap

<!-- TODO: Maintainers should fill in concrete milestones, timelines, and links to tracking issues -->

Smoot's initial code migration from its predecessor project is complete. Current and planned areas of development include:

- **Multi-party computation (MPC) for relayers** — Enhancing the relay layer with threshold signatures to remove single-point-of-trust assumptions.
- **Zero-knowledge proof integration** — Adding ZK-based verification for cross-chain state proofs.
- **Additional chain support** — Extending the framework to new networks including Cardano, with further integrations planned based on community demand.
- **Hybrid bridging modes** — Supporting both lock-and-mint and liquidity-pool-based transfer mechanisms.

We welcome community input on roadmap priorities. Please open an issue in the [bridge repository](https://github.com/LFDT-Smoot/bridge/issues) or raise it in our community calls.

## Resources

The following documents and links will help you understand Smoot's vision, governance, and community processes:

- The [Smoot Technical Charter](https://github.com/LFDT-Smoot/governance/blob/main/Smoot%20Technical%20Charter%20Final%204-17-2025.md) describes the project's governance structure and decision-making processes.
- Community presentations and recordings are available in the [Smoot YouTube playlist](https://www.youtube.com/playlist?list=PL0MZ85B_96CE-gF5178qvm0-kdt5xggPE).
- All Smoot repositories are licensed under the [Apache 2.0 License](https://github.com/LFDT-Smoot/governance/blob/main/LICENSE).
- Our [Code of Conduct](https://www.lfdecentralizedtrust.org/code-of-conduct).
<!-- TODO: Add these files and uncomment the links
- Our [CONTRIBUTING.md](https://github.com/LFDT-Smoot/bridge/blob/main/CONTRIBUTING.md) explains how to contribute code, documentation, and ideas.
- Our [MAINTAINERS.md](https://github.com/LFDT-Smoot/bridge/blob/main/MAINTAINERS.md) lists the current project maintainers and their affiliations.
- Our [SECURITY.md](https://github.com/LFDT-Smoot/bridge/blob/main/SECURITY.md) describes how to responsibly report security vulnerabilities. Do not post security issues publicly.
-->

### Files to Be Added

The following standard LFDT project files are in progress, and will be updated soon:
<!-- TODO: Maintainers: please create these in the `bridge` repository as soon as possible. -->

- `CONTRIBUTING.md` — Contribution guidelines (coding standards, PR process, commit conventions)
- `MAINTAINERS.md` — List of maintainers with names, organizations, and GitHub handles
- `SECURITY.md` — Vulnerability disclosure and reporting policy
- `ADOPTERS.md` — Organizations and projects using Smoot in production or development

## Discord Communication Channels

Discord is the primary communication platform for LFDT projects, including Smoot.

### How to Join

1. **Join the LFDT Discord Server** — Click the invite link: **[LFDT Discord](https://discord.gg/hyperledger)**. Create a free Discord account if you don't already have one.
2. **Agree to the server rules** — You'll land in a welcome or rules channel. Read and accept the rules to unlock the full set of channels.
3. **Find the Smoot channels** — Look for Smoot-related channels under the LFDT channel categories.

<!-- TODO: Replace with actual Smoot Discord channel links once they exist -->

| Channel | Purpose |
|---|---|
| **#smoot-general** | General discussion, questions, and conversation about Smoot |


## Community Meetings

<!-- TODO: Replace with actual Zoom/LFX calendar links and registration URLs -->

Smoot holds regular community calls open to everyone. These are the best way to stay up to date, ask questions, and contribute to the project direction.

| Meeting | Frequency | Calendar Link |
|---|---|---|
| Smoot Community Call |  | https://zoom-lfx.platform.linuxfoundation.org/meetings/smoot?view=week | 

### Meeting Recordings

Past meeting recordings and presentations can be accessed through:

1. **[Youtube Smoot Playlist](https://www.youtube.com/playlist?list=PL0MZ85B_96CE-gF5178qvm0-kdt5xggPE)**
2. **LFDT Calendar** — Browse past meeting recordings in the [LFDT project calendars](https://zoom-lfx.platform.linuxfoundation.org/meetings/lf-decentralized-trust).

## Contributing

We welcome contributions of all kinds — code, documentation, testing, design feedback, and use-case ideas. Here's how to get started:

1. **Check the issues** — Browse [open issues](https://github.com/LFDT-Smoot/bridge/issues) in the bridge repository for tasks that interest you. Look for issues labeled `good first issue` or `help wanted`.
2. **Join the conversation** — Introduce yourself on Discord or attend a community call. We're happy to help newcomers find a good starting point.
3. **Open a PR** — Fork the repository, make your changes on a branch, and submit a pull request with a clear description of what you've done and why.
4. **Report bugs** — If you find a problem, open an issue with steps to reproduce it.
5. **Propose features** — Have an idea? Open an issue describing the use case and your proposed approach. Discussing first helps align efforts and avoids duplicate work.

## Current Status

Smoot is an **incubation** project under LFDT. The initial code migration from its predecessor project is complete, and the team is actively developing new features and working to grow the contributor community. We are looking for collaborators from organizations interested in cross-chain interoperability — whether you want to integrate a new chain, contribute to the relay infrastructure, or build applications on top of Smoot.

## License

All Smoot repositories are licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).