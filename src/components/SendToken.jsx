import { useState } from "react";
import { ethers } from "ethers";
import { sendErc42Tokens } from "../services/token.js";
import { SEPOLIA_NETWORK } from "../contracts/config.js";

function SendToken({ isEnabled, onTransferSuccess }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle"); // idle, submitting, confirming, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEnabled) return;

    setStatus("idle");
    setErrorMessage("");
    setTxHash("");

    const cleanAddress = recipient.trim();
    if (!cleanAddress) {
      setStatus("error");
      setErrorMessage("Recipient address is required.");
      return;
    }
    if (!ethers.isAddress(cleanAddress)) {
      setStatus("error");
      setErrorMessage("Please enter a valid Ethereum address.");
      return;
    }

    const cleanAmount = amount.trim();
    if (!cleanAmount) {
      setStatus("error");
      setErrorMessage("Amount is required.");
      return;
    }
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setStatus("error");
      setErrorMessage("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      setStatus("submitting");
      const tx = await sendErc42Tokens(cleanAddress, cleanAmount);
      
      setStatus("confirming");
      setTxHash(tx.hash);

      await tx.wait();
      
      setStatus("success");
      setRecipient("");
      setAmount("");
      
      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      setStatus("error");
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        setErrorMessage("Transaction was rejected in MetaMask.");
      } else {
        setErrorMessage(error.message || "An unexpected error occurred.");
      }
    }
  };

  const isPending = status === "submitting" || status === "confirming";

  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <p className="card-label">Transfer</p>
        <h2>Send E42</h2>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          Recipient address
          <input 
            placeholder="0x..." 
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!isEnabled || isPending} 
          />
        </label>
        <label>
          Amount
          <input 
            placeholder="0.0" 
            inputMode="decimal" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isEnabled || isPending} 
          />
        </label>
        <button 
          className="primary-button" 
          type="submit" 
          disabled={!isEnabled || isPending}
        >
          {status === "submitting" && "Waiting for Signature..."}
          {status === "confirming" && "Confirming Tx..."}
          {status !== "submitting" && status !== "confirming" && "Send"}
        </button>
      </form>

      {status === "error" && (
        <div className="status-alert error">
          <p>{errorMessage}</p>
        </div>
      )}

      {status === "confirming" && txHash && (
        <div className="status-alert info">
          <p>Transaction sent! Waiting for block confirmation...</p>
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
          <p>Tokens sent successfully!</p>
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

export default SendToken;
