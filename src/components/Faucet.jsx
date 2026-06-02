import { useEffect, useMemo, useState } from "react";
import { SEPOLIA_NETWORK } from "../contracts/config.js";
import { claimErc42Tokens, getFaucetState } from "../services/token.js";

const initialFaucetState = {
  claimAmount: "100 E42",
  cooldownSeconds: 0,
  lastClaimAt: 0,
  nextClaimAt: 0,
  secondsUntilClaim: 0,
  canClaim: false
};

function formatCountdown(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) {
    return "Ready now";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatTimestamp(unixSeconds) {
  if (!unixSeconds) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(unixSeconds * 1000));
}

function Faucet({ address, isEnabled, onClaimSuccess }) {
  const [faucetState, setFaucetState] = useState(initialFaucetState);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isLoadingState, setIsLoadingState] = useState(false);

  const isPending = status === "submitting" || status === "confirming";
  const nextClaimLabel = useMemo(
    () =>
      faucetState.canClaim
        ? "Ready now"
        : formatCountdown(faucetState.secondsUntilClaim),
    [faucetState.canClaim, faucetState.secondsUntilClaim]
  );

  useEffect(() => {
    let isActive = true;

    async function loadState() {
      if (!address || !isEnabled) {
        setFaucetState(initialFaucetState);
        setStatus("idle");
        setErrorMessage("");
        setTxHash("");
        return;
      }

      setIsLoadingState(true);

      try {
        const nextState = await getFaucetState(address);
        if (!isActive) return;
        setFaucetState(nextState);
        setErrorMessage("");
      } catch (error) {
        if (!isActive) return;
        setErrorMessage(error.message);
        setFaucetState(initialFaucetState);
      } finally {
        if (isActive) {
          setIsLoadingState(false);
        }
      }
    }

    loadState();

    return () => {
      isActive = false;
    };
  }, [address, isEnabled]);

  useEffect(() => {
    if (!faucetState.nextClaimAt) {
      return undefined;
    }

    function refreshCountdown() {
      setFaucetState((current) => {
        if (!current.nextClaimAt) {
          return current;
        }

        const secondsUntilClaim = Math.max(
          current.nextClaimAt - Math.floor(Date.now() / 1000),
          0
        );

        return {
          ...current,
          secondsUntilClaim,
          canClaim: secondsUntilClaim === 0
        };
      });
    }

    refreshCountdown();
    const intervalId = window.setInterval(refreshCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [faucetState.nextClaimAt]);

  async function refreshFaucetState() {
    if (!address || !isEnabled) {
      return;
    }

    const nextState = await getFaucetState(address);
    setFaucetState(nextState);
  }

  async function handleClaim() {
    if (!isEnabled || isPending) return;

    setStatus("idle");
    setErrorMessage("");
    setTxHash("");

    try {
      setStatus("submitting");
      const tx = await claimErc42Tokens();

      setStatus("confirming");
      setTxHash(tx.hash);

      await tx.wait();

      setStatus("success");
      await onClaimSuccess?.();

      try {
        await refreshFaucetState();
      } catch (refreshError) {
        console.error("Failed to refresh faucet state:", refreshError);
      }
    } catch (error) {
      setStatus("error");
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        setErrorMessage("Transaction was rejected in MetaMask.");
      } else {
        setErrorMessage(error.message || "An unexpected error occurred.");
      }
    }
  }

  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <p className="card-label">Faucet</p>
        <h2>Claim test tokens</h2>
      </div>

      <div className="faucet-body">
        <dl className="faucet-stats">
          <div>
            <dt>Claim amount</dt>
            <dd>{isLoadingState ? "Loading..." : faucetState.claimAmount}</dd>
          </div>
          <div>
            <dt>Cooldown</dt>
            <dd>{isLoadingState ? "Loading..." : `${faucetState.cooldownSeconds}s`}</dd>
          </div>
          <div>
            <dt>Next claim</dt>
            <dd>{isLoadingState ? "Loading..." : nextClaimLabel}</dd>
          </div>
          <div>
            <dt>Last claim</dt>
            <dd>{isLoadingState ? "Loading..." : formatTimestamp(faucetState.lastClaimAt)}</dd>
          </div>
        </dl>

        <p>
          Claiming sends test E42 directly from the faucet contract on Sepolia.
        </p>

        <button
          className="primary-button"
          type="button"
          disabled={!isEnabled || isPending || isLoadingState || !faucetState.canClaim}
          onClick={handleClaim}
        >
          {status === "submitting" && "Waiting for Signature..."}
          {status === "confirming" && "Confirming Claim..."}
          {status !== "submitting" && status !== "confirming" && "Claim E42"}
        </button>
      </div>

      {status === "error" && (
        <div className="status-alert error">
          <p>{errorMessage}</p>
        </div>
      )}

      {status === "confirming" && txHash && (
        <div className="status-alert info">
          <p>Claim sent! Waiting for block confirmation...</p>
          <a
            href={`${SEPOLIA_NETWORK.blockExplorerUrls[0]}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Etherscan
          </a>
        </div>
      )}

      {status === "success" && (
        <div className="status-alert success">
          <p>Claim successful.</p>
          <p>{faucetState.claimAmount} has been added to your wallet.</p>
          {txHash && (
            <a
              href={`${SEPOLIA_NETWORK.blockExplorerUrls[0]}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Etherscan
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export default Faucet;
