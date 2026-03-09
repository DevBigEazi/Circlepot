# Circlepot Technical Documentation (Current Implementation)

## 1. Project Overview

**Circlepot** is a decentralized finance platform that digitizes **Rotating Savings and Credit Associations (ROSCAs)** and personal savings goals. It combines community-driven saving mechanisms with on-chain reputation scoring and decentralized yield options, providing a transparent, trustless, and user-friendly experience **powered by Avalanche**.

---

## 2. Tech Stack

### 2.1 Smart Contracts (Core Logic)

- **Network**: **Avalanche Fuji Testnet**.
- **Language**: Solidity (^0.8.27).
- **Architecture**:
  - **UUPS Upgradeable**: All core contracts use the Universal Upgradeable Proxy Standard for future-proofing.
  - **Multi-Token Support**: Platform-wide support for multiple ERC20 tokens (e.g., USDC, USDT).
  - **Yield Logic (Personal Goals Only)**: Integration with **ERC-4626 Tokenized Vaults** for goal-based interest generation in the `PersonalSavings` module.
- **Key Modules**:
  - `CircleSavings.sol`: Manages community savings circles, payouts, collateral, and voting (ROSCAs). Focuses on principal protection and social coordination.
  - `PersonalSavings.sol`: Manages individual non-community goals with **optional yield-bearing deposits** (ERC-4626) and progress-based early withdrawal penalties.
  - `Reputation.sol`: Centralized registry for tracking credit scores based on user reliability (on-time payments, goal completions) across the platform.
  - `ReferralRewards.sol`: Growth mechanism incentivizing new user onboarding.

### 2.2 Data Indexing (The Graph)

- **Middleware**: Subgraph deployed to provide a structured GraphQL API for the frontend.
- **Indexing Strategy**: Real-time event listening for state changes across all core contracts.
- **Entities**: Tracks `User`, `Circle`, `Member`, `PersonalGoal`, and `ReputationHistory`, enabling fast relational queries for the dashboard.

### 2.3 Frontend (Modern Web)

- **Framework**: Next.js 16 (App Router) / React 19.
- **Styling**: Tailwind CSS 4.
- **Onboarding & Auth**: **Dynamic SDK** for seamless social and email login.
- **Account Abstraction (AA)**: **ZeroDev (Kernel v3)**.
  - **Signer**: Dynamic Embedded Wallets.
  - **Smart Account**: **ZeroDev Kernel v3** (EntryPoint v0.7).
  - **Gasless UX**: Sponsored transactions via the ZeroDev Paymaster for all on-chain actions on **Avalanche**.
- **Infrastructure**: Wagmi/Viem for type-safe interactions; TanStack Query for server-state management.

---

## 3. Architecture Decisions

### 3.1 Optimized for Simplicity (USDT Only)

To ensure the best experience for our primary audience of **non-crypto users**, Circlepot avoids the complexity of supporting multiple stablecoins. By standardizing on **USDT (Avalanche)**, we offer price stability while preventing the "multi-choice fatigue" that often confuses users new to the DeFi ecosystem.

### 3.2 Powered by Avalanche

The choice of **Avalanche Fuji** allows for fast finality and low transaction costs, essential for a real-time savings platform. The stability of the network complements the gasless abstraction provided by ZeroDev.

### 3.3 Targeted Yield Strategy

A critical architectural decision was to limit **Yield-bearing savings (via ERC-4626)** to the `PersonalSavings` module. Unlike community circles that prioritize social coordination and principal stability, personal goals are designed for individual flexibility, allowing users to opt into DeFi yield protocols (e.g., Aave) to grow their savings over time.

### 3.4 Zero-Friction Web2 Onboarding

By combining **Dynamic's** social auth with **ZeroDev's** smart accounts, Circlepot removes the "seed phrase" hurdle. Users sign in like a traditional web app and are immediately provisioned with a smart account, enabling complex on-chain interactions without managing gas tokens.

### 3.5 Trustless Community Payouts

In `CircleSavings`, trust is enforced through **Collateral**. Each participant locks 100% of one round's contribution as collateral upon joining. This ensures the payout pot remains stable and guaranteed for the scheduled recipient, even if a member is late.

### 3.6 Dynamic Payout Ordering & Reputation

Payout positions in community circles are assigned based on the user's **Reputation Score** at the moment the circle starts. This creates a clear incentive for on-time behavior across all platform products.

---

## 4. Implementation Approach

### 4.1 Event-Driven Synchronization

The platform relies on a "Blockchain → Subgraph → UI" flow. Every contract event triggers a subgraph update, which the UI then fetches via GraphQL. This ensures that historical data (like a user's lifetime savings) is served efficiently.

### 4.2 Modular Reputation Registry

The `Reputation` contract acts as a unified "source of truth" for user reliability. Both `CircleSavings` and `PersonalSavings` report behavioral triggers (completions, late payments, withdrawals) to this ledger.

### 4.3 AA Provider Integration

The `DynamicProvider.tsx` and `useAccountAddress.ts` hooks ensure that users interact primarily via their **ZeroDev Smart Account**. This allows the platform to use **Paymasters** on **Avalanche** to sponsor gas fees.

---

## 5. Revenue & Sustainability

- **Tiered Circle Fees**: Percentage-based or fixed fees on circle payouts depending on the amount.
- **Yield Sharing**: The platform captures a **10% share** of generated yield from completed **Yield Goals**, while **90%** goes to the user.
- **Sustainability Pool**: Fees from late payments and early-withdrawals support the infrastructure and gas sponsorship pool.

---

## 6. Conclusion

Circlepot is a state-of-the-art social finance platform **powered by Avalanche**. By leveraging **ZeroDev** for gasless account abstraction and isolating DeFi yield to **Personal Goals**, the platform offers a secure, high-performance financial experience that scales for global users.
