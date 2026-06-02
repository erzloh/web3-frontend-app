import { formatAddress } from "../services/wallet.js";

function Header({
  wallet,
  hasMetaMask,
  isSepolia,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchNetwork
}) {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        E42
      </a>

      <div className="wallet-actions">
        {wallet.address && (
          <span className={isSepolia ? "network-badge good" : "network-badge"}>
            {isSepolia ? "Sepolia" : "Wrong network"}
          </span>
        )}

        {wallet.address && !isSepolia && (
          <button className="secondary-button" onClick={onSwitchNetwork}>
            Switch to Sepolia
          </button>
        )}

        {wallet.address ? (
          <span className="connected-wallet-badge" title={wallet.address}>
            {formatAddress(wallet.address)}
          </span>
        ) : (
          <button
            className="primary-button"
            onClick={onConnectWallet}
            disabled={!hasMetaMask || wallet.isConnecting}
          >
            {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        {wallet.address && (
          <button className="secondary-button" onClick={onDisconnectWallet}>
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
