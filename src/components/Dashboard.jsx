import { ERC42_CONTRACT_ADDRESS } from "../contracts/config.js";
import { formatAddress } from "../services/wallet.js";

function Dashboard({ wallet, token, isSepolia }) {
  const isConnected = Boolean(wallet.address);
  const tokenData = token.data;

  return (
    <section className="dashboard-grid" aria-label="ERC42 dashboard">
      <article className="info-card">
        <p className="card-label">Token</p>
        <h2>{tokenData?.name || "Eric42"}</h2>
        <dl>
          <div>
            <dt>Symbol</dt>
            <dd>{tokenData?.symbol || "ERC42"}</dd>
          </div>
          <div>
            <dt>Total Supply</dt>
            <dd>{token.isLoading ? "Loading..." : tokenData?.totalSupply || "-"}</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>
              {formatAddress(tokenData?.contractAddress || ERC42_CONTRACT_ADDRESS)}
            </dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>Sepolia</dd>
          </div>
        </dl>
        {token.message && <p className="card-note">{token.message}</p>}
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
          <div>
            <dt>ERC42 Balance</dt>
            <dd>
              {token.isLoading
                ? "Loading..."
                : isConnected && isSepolia
                  ? tokenData?.walletBalance || "-"
                  : "-"}
            </dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

export default Dashboard;
