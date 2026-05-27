import { ERC42_CONTRACT_ADDRESS } from "../contracts/config.js";
import { formatAddress } from "../services/wallet.js";

function Dashboard({ wallet, isSepolia }) {
  const isConnected = Boolean(wallet.address);

  return (
    <section className="dashboard-grid" aria-label="ERC42 dashboard">
      <article className="info-card">
        <p className="card-label">Token</p>
        <h2>Eric42</h2>
        <dl>
          <div>
            <dt>Symbol</dt>
            <dd>ERC42</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>{formatAddress(ERC42_CONTRACT_ADDRESS)}</dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>Sepolia</dd>
          </div>
        </dl>
      </article>

      <article className="info-card">
        <p className="card-label">Wallet</p>
        <h2>{isConnected ? formatAddress(wallet.address) : "Not connected"}</h2>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{isConnected ? "Connected" : "Connect MetaMask"}</dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>{isConnected ? (isSepolia ? "Sepolia" : "Switch needed") : "-"}</dd>
          </div>
          <div>
            <dt>ETH Balance</dt>
            <dd>{wallet.ethBalance || "-"}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

export default Dashboard;
