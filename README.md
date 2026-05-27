# ERC42 React Wallet & Faucet dApp

## Project Overview

The goal of this project is to build a React-based decentralized application (dApp) for the ERC42 token deployed on the Sepolia network.

The application will allow users to:

* Connect their MetaMask wallet
* View ERC42 token information
* View wallet balances
* Send ERC42 tokens
* Claim free ERC42 tokens from a faucet

The project is intended as a learning experience for:

* Ethereum development
* ERC-20 tokens
* Wallet integration
* Smart contract interaction
* Web3 frontend development

The application should remain simple, understandable, and easy to extend later.

---

# Project Goals

The application should help learn:

* How wallets connect to dApps
* How ERC-20 transfers work
* How blockchain transactions are signed
* How smart contracts are called from React
* How token faucet systems operate
* Basic Web3 application architecture

---

# Technology Stack

## Frontend

* React
* JavaScript
* CSS

## Web3 Library

* ethers.js

## Wallet Support

* MetaMask

## Blockchain

* Ethereum Sepolia Testnet

## Smart Contracts

* Solidity
* OpenZeppelin ERC20

## Hosting

Possible hosting options:

* Vercel
* Netlify
* GitHub Pages

---

# Existing ERC42 Token Contract

The application will interact with the already deployed ERC42 token contract.

```solidity id="f5wfgn"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Eric42 is ERC20, ERC20Permit {
    constructor(uint256 initialSupply)
        ERC20("Eric42", "ERC42")
        ERC20Permit("Eric42")
    {
        _mint(msg.sender, initialSupply);
    }
}
```

---

# Core Features

# 1. MetaMask Wallet Connection

## Description

Users can connect their MetaMask wallet to the application.

The application should:

* detect whether MetaMask is installed
* request wallet connection
* display the connected address
* detect the active network
* prompt the user to switch to Sepolia if necessary

---

# Functionalities

## Connect Wallet

The user clicks a “Connect Wallet” button.

MetaMask opens and requests permission.

After approval:

* the wallet address is displayed
* balances are loaded
* the dashboard becomes active

---

## Wallet State Management

The application should track:

* connected address
* connection status
* current network
* token balance
* ETH balance

---

## Network Validation

The application must verify the user is connected to:

* Sepolia

If not:

* show warning message
* optionally request network switch

---

# UI Elements

## Header

Contains:

* application title
* Connect Wallet button
* connected wallet address
* network badge

---

## Example

```text id="11g7fi"
Wallet: 0x1234...abcd
Network: Sepolia
```

---

# 2. ERC42 Dashboard

## Description

The dashboard displays information about the ERC42 token and the connected wallet.

---

# Displayed Information

## Token Information

* token name
* token symbol
* total supply
* contract address

---

## Wallet Information

* connected wallet address
* ERC42 balance
* ETH balance

---

# Smart Contract Functions Used

```solidity id="8i2l9e"
name()
symbol()
totalSupply()
balanceOf(address)
```

---

# 3. Send Token Feature

## Description

Users can transfer ERC42 tokens to another wallet directly from the application.

This feature should behave similarly to sending tokens inside MetaMask.

---

# User Flow

1. User enters recipient address
2. User enters token amount
3. User clicks “Send”
4. MetaMask transaction popup appears
5. User confirms transaction
6. Transaction is broadcast to Sepolia
7. Success or error message is displayed

---

# Smart Contract Function Used

```solidity id="jlwm5m"
transfer(address to, uint256 amount)
```

---

# Validation Rules

The application should verify:

* recipient address is valid
* amount is greater than zero
* sufficient ERC42 balance exists
* MetaMask is connected
* user is on Sepolia

---

# UI Elements

## Send Token Form

Contains:

* recipient address input
* amount input
* send button

---

## Transaction Status Messages

Examples:

```text id="ijlsn0"
Transaction submitted...
Transaction confirmed.
Invalid wallet address.
Insufficient token balance.
```

---

# 4. Faucet Feature

## Description

The faucet allows users to claim free ERC42 tokens for testing and learning purposes.

This enables users to experiment with transfers without requiring initial token ownership.

---

# Faucet Rules

## Example Configuration

* 100 ERC42 per claim
* 24-hour cooldown

---

# Recommended Faucet Architecture

## Backend-Controlled Faucet Wallet

Recommended implementation:

* a backend wallet stores ERC42 tokens
* backend sends ERC42 to users after claim requests

---

# Backend Responsibilities

The backend should:

* receive faucet requests
* validate wallet addresses
* enforce cooldown restrictions
* send ERC42 transactions

---

# Suggested Backend Technologies

* Node.js
* Express
* ethers.js

---

# Faucet UI

## Elements

* Claim button
* Cooldown timer
* Faucet status messages

---

## Example Messages

```text id="ewkq2f"
Claim successful.
Please wait before claiming again.
Faucet temporarily unavailable.
```

---

# React Application Structure

# Suggested Folder Structure

```text id="j6s4ij"
src/
├── components/
│   ├── Header.js
│   ├── Dashboard.js
│   ├── SendToken.js
│   └── Faucet.js
│
├── services/
│   ├── wallet.js
│   ├── token.js
│   └── faucet.js
│
├── contracts/
│   ├── ERC42ABI.js
│   └── config.js
│
├── App.js
├── index.js
└── styles.css
```

---

# Suggested React Components

## Header Component

Responsibilities:

* wallet connection
* network status
* connected address display

---

## Dashboard Component

Responsibilities:

* display token information
* display balances

---

## SendToken Component

Responsibilities:

* handle token transfer form
* validate user input
* submit transactions

---

## Faucet Component

Responsibilities:

* claim faucet tokens
* display cooldown state
* show faucet status

---

# Recommended Application Flow

## Step 1

User opens the application.

---

## Step 2

Application checks:

* MetaMask availability
* current network

---

## Step 3

User connects wallet.

---

## Step 4

Application loads:

* ERC42 token data
* wallet balances

---

## Step 5

User can:

* send ERC42 tokens
* claim faucet tokens

---

# Security Considerations

## Frontend

The application should:

* validate addresses
* validate token amounts
* handle rejected MetaMask transactions
* prevent invalid form submissions

---

## Faucet

The backend should:

* rate limit claims
* prevent abuse
* validate requests

---

## Wallet Safety

The application must never:

* request private keys
* request seed phrases
* store wallet secrets

All transaction signing must happen inside MetaMask.

---

# Future Improvements

Possible future additions:

* transaction history
* holder leaderboard
* live transfer feed
* mobile responsive design
* dark mode
* ERC20Permit integration
* gasless approvals
* staking system
* governance system

---

# Final Goal

The final product should behave as a lightweight ERC42 wallet dashboard where users can:

* connect MetaMask
* inspect ERC42 information
* view balances
* send ERC42 tokens
* claim ERC42 faucet tokens

while remaining simple enough to fully understand as a Web3 learning project.
