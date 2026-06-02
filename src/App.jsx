import { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import EventHistory from "./components/EventHistory.jsx";
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
import {
  getErc42DashboardData,
  isTokenContractConfigured
} from "./services/token.js";

const initialWalletState = {
  address: "",
  chainId: "",
  ethBalance: "",
  isConnecting: false,
  message: ""
};

const initialTokenState = {
  data: null,
  isLoading: false,
  message: isTokenContractConfigured()
    ? ""
    : "E42 contract address is not configured yet."
};

function App() {
  const [wallet, setWallet] = useState(initialWalletState);
  const [token, setToken] = useState(initialTokenState);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const hasMetaMask = useMemo(() => Boolean(getInstalledWallet()), []);
  const isSepolia = wallet.chainId === SEPOLIA_CHAIN_ID;

  const loadTokenDashboard = useCallback(async (address, chainId) => {
    if (!address || chainId !== SEPOLIA_CHAIN_ID) {
      setToken((current) => ({
        ...current,
        data: null,
        isLoading: false
      }));
      return;
    }

    setToken((current) => ({
      ...current,
      isLoading: true,
      message: ""
    }));

    try {
      const data = await getErc42DashboardData(address);
      setToken({
        data,
        isLoading: false,
        message: ""
      });
    } catch (error) {
      setToken({
        data: null,
        isLoading: false,
        message: error.message
      });
    }
  }, []);

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
      await loadTokenDashboard(address, network.chainId);
    },
    [loadTokenDashboard, wallet.address]
  );

  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((current) => current + 1);
  }, []);

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
      await loadTokenDashboard(connection.address, connection.chainId);
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

  function handleDisconnectWallet() {
    setWallet({
      ...initialWalletState,
      message: "Wallet disconnected in this app."
    });
    setToken(initialTokenState);
  }

  useEffect(() => {
    const ethereum = getInstalledWallet();
    if (!ethereum) return undefined;

    function handleAccountsChanged(accounts) {
      const [nextAddress] = accounts;
      if (!nextAddress) {
        setWallet(initialWalletState);
        setToken(initialTokenState);
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
        onDisconnectWallet={handleDisconnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
      />

      <main className="main-layout">
        <section className="intro-panel">
          <div>
            <p className="eyebrow">Sepolia learning dApp</p>
            <h1>E42 Wallet</h1>
            <p>
              Connect MetaMask, inspect E42 token data, and build toward
              transfers and faucet claims one step at a time.
            </p>
          </div>
          {wallet.message && <p className="status-message">{wallet.message}</p>}
        </section>

        <Dashboard wallet={wallet} token={token} isSepolia={isSepolia} />

        <EventHistory refreshKey={historyRefreshKey} />

        <div className="two-column">
          <SendToken 
            isEnabled={Boolean(wallet.address) && isSepolia} 
            onTransferSuccess={() => {
              refreshWallet();
              refreshHistory();
            }}
          />
          <Faucet
            address={wallet.address}
            isEnabled={Boolean(wallet.address) && isSepolia}
            onClaimSuccess={() => {
              refreshWallet();
              refreshHistory();
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
