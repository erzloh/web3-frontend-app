import { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Faucet from "./components/Faucet.jsx";
import Header from "./components/Header.jsx";
import SendToken from "./components/SendToken.jsx";
import { SEPOLIA_CHAIN_ID } from "./contracts/config.js";
import {
  connectWallet,
  getCurrentNetwork,
  getEthBalance,
  getInstalledWallet,
  switchToSepolia
} from "./services/wallet.js";

const initialWalletState = {
  address: "",
  chainId: "",
  ethBalance: "",
  isConnecting: false,
  message: ""
};

function App() {
  const [wallet, setWallet] = useState(initialWalletState);
  const hasMetaMask = useMemo(() => Boolean(getInstalledWallet()), []);
  const isSepolia = wallet.chainId === SEPOLIA_CHAIN_ID;

  const refreshWallet = useCallback(
    async (address = wallet.address) => {
      if (!address) return;

      const [network, balance] = await Promise.all([
        getCurrentNetwork(),
        getEthBalance(address)
      ]);

      setWallet((current) => ({
        ...current,
        address,
        chainId: network.chainId,
        ethBalance: balance
      }));
    },
    [wallet.address]
  );

  async function handleConnectWallet() {
    setWallet((current) => ({
      ...current,
      isConnecting: true,
      message: ""
    }));

    try {
      const connection = await connectWallet();
      setWallet((current) => ({
        ...current,
        address: connection.address,
        chainId: connection.chainId,
        ethBalance: connection.ethBalance,
        message:
          connection.chainId === SEPOLIA_CHAIN_ID
            ? "Wallet connected."
            : "Please switch to Sepolia."
      }));
    } catch (error) {
      setWallet((current) => ({
        ...current,
        message: error.message
      }));
    } finally {
      setWallet((current) => ({
        ...current,
        isConnecting: false
      }));
    }
  }

  async function handleSwitchNetwork() {
    try {
      await switchToSepolia();
      await refreshWallet();
      setWallet((current) => ({
        ...current,
        message: "Switched to Sepolia."
      }));
    } catch (error) {
      setWallet((current) => ({
        ...current,
        message: error.message
      }));
    }
  }

  useEffect(() => {
    const ethereum = getInstalledWallet();
    if (!ethereum) return undefined;

    function handleAccountsChanged(accounts) {
      const [nextAddress] = accounts;
      if (!nextAddress) {
        setWallet(initialWalletState);
        return;
      }
      refreshWallet(nextAddress);
    }

    function handleChainChanged() {
      refreshWallet();
    }

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [refreshWallet]);

  return (
    <div className="app-shell">
      <Header
        wallet={wallet}
        hasMetaMask={hasMetaMask}
        isSepolia={isSepolia}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
      />

      <main className="main-layout">
        <section className="intro-panel">
          <div>
            <p className="eyebrow">Sepolia learning dApp</p>
            <h1>ERC42 Wallet</h1>
            <p>
              Connect MetaMask, inspect ERC42 token data, and build toward
              transfers and faucet claims one step at a time.
            </p>
          </div>
          {wallet.message && <p className="status-message">{wallet.message}</p>}
        </section>

        <Dashboard wallet={wallet} isSepolia={isSepolia} />

        <div className="two-column">
          <SendToken isEnabled={Boolean(wallet.address) && isSepolia} />
          <Faucet isEnabled={Boolean(wallet.address) && isSepolia} />
        </div>
      </main>
    </div>
  );
}

export default App;
