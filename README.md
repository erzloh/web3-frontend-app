

E42 dashboard

![E42 frontend demo](screenshots/E42%20frontend%20demo.gif)

Overview
---
E42 dashboard is a lightweight React web3 app for interacting with an Ethereum token (called E42) I made. It includes components for sending tokens, a faucet to claim free tokens, a surprise-purchase flow, and an event history viewer.

Features
---
- Wallet connection using MetaMask or other wallet providers.
- Token and wallet data: Displays token balance, total supply, and other relevant information.
- Send Token: Simple form to transfer tokens to another address.
- Faucet: faucet to request free tokens.
- Surprise Purchase: Example purchase flow calling a sample service.
- Event History: Displays transactions and contract events.

Prerequisites
---
- Node.js v24.10.0 (tested) — Node.js v24 or newer recommended
- npm, yarn, or pnpm

Quick start
---
1. Install dependencies from the project root:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in your browser at http://localhost:5173 (Vite default)

Token repository
---
- The E42 token contract and related code: [erzloh/Tokenizer](https://github.com/erzloh/Tokenizer)

Configuration
---
- Edit `src/contracts/config.js` to set network, RPC endpoints, and contract addresses used by the app.