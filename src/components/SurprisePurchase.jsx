import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  ERC42_CONTRACT_ADDRESS,
  ERC42_CONTRACT_DECIMALS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK
} from "../contracts/config.js";
import { sendErc42Tokens } from "../services/token.js";
import { confirmSurprisePayment, getSurprisePayment } from "../services/surprise.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialPaymentState = {
  merchantAddress: "",
  tokenAddress: "",
  amountBaseUnits: "",
  chainId: "",
  processedAt: "",
  emailSent: false
};

function SurprisePurchase({ address, isEnabled, onPurchaseSuccess }) {
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState(initialPaymentState);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [result, setResult] = useState(null);

  const isBusy = useMemo(
    () => ["loading-payment", "submitting-payment", "confirming"].includes(status),
    [status]
  );

  const paymentAmount = payment.amountBaseUnits
    ? ethers.formatUnits(payment.amountBaseUnits, ERC42_CONTRACT_DECIMALS)
    : "";

  useEffect(() => {
    let isActive = true;

    async function loadPayment() {
      if (!isEnabled) {
        setPayment(initialPaymentState);
        setStatus("idle");
        setErrorMessage("");
        setTxHash("");
        setResult(null);
        return;
      }

      setStatus("loading-payment");
      setErrorMessage("");

      try {
        const data = await getSurprisePayment();
        if (!isActive) return;

        if (data.chainId && data.chainId !== SEPOLIA_CHAIN_ID) {
          throw new Error("The surprise backend is configured for the wrong network.");
        }

        if (
          data.tokenAddress &&
          data.tokenAddress.toLowerCase() !== ERC42_CONTRACT_ADDRESS.toLowerCase()
        ) {
          throw new Error("The surprise backend returned an unexpected token address.");
        }

        setPayment(data);
        setStatus("ready");
      } catch (error) {
        if (!isActive) return;
        setPayment(initialPaymentState);
        setStatus("error");
        setErrorMessage(error.message || "Could not load surprise payment details.");
      }
    }

    loadPayment();

    return () => {
      isActive = false;
    };
  }, [isEnabled]);

  async function handlePaySurprise() {
    if (!isEnabled || isBusy || !payment.merchantAddress) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setStatus("error");
      setErrorMessage("Email is required.");
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!ethers.isAddress(address)) {
      setStatus("error");
      setErrorMessage("Connected wallet address is invalid.");
      return;
    }

    try {
      setStatus("submitting-payment");
      const tx = await sendErc42Tokens(payment.merchantAddress, paymentAmount);
      setTxHash(tx.hash);
      setStatus("confirming");

      await tx.wait();

      const confirmation = await confirmSurprisePayment({
        email: cleanEmail,
        payerAddress: address,
        txHash: tx.hash
      });

      setResult(confirmation);

      if (confirmation.status !== "confirmed") {
        setStatus("error");
        setErrorMessage(
          confirmation.reason || "Payment was submitted, but the backend did not accept it."
        );
        return;
      }

      setStatus("success");
      await onPurchaseSuccess?.();
    } catch (error) {
      setStatus(txHash ? "needs-confirmation" : "error");
      setErrorMessage(error.message || "Unexpected payment error.");
    }
  }

  const canPay =
    isEnabled &&
    !isBusy &&
    Boolean(payment.merchantAddress) &&
    Boolean(payment.amountBaseUnits);

  return (
    <section className="tool-panel surprise-panel">
      <div className="panel-heading">
        <p className="card-label">Surprise</p>
        <h2>Buy a surprise</h2>
      </div>

      <form className="form-stack" onSubmit={(e) => e.preventDefault()}>
        <label>
          Email address
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEnabled || isBusy}
          />
        </label>

        <div className="surprise-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handlePaySurprise}
            disabled={!canPay}
          >
            {status === "submitting-payment" && "Waiting for Signature..."}
            {status === "confirming" && "Verifying payment..."}
            {status !== "submitting-payment" && status !== "confirming" && "Pay"}
          </button>
        </div>
      </form>

      {status === "error" && (
        <div className="status-alert error">
          <p>{errorMessage}</p>
        </div>
      )}

      {status === "needs-confirmation" && (
        <div className="status-alert info">
          <p>The transaction was sent. The backend still needs to confirm it.</p>
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

      {status === "confirming" && txHash && (
        <div className="status-alert info">
          <p>Payment sent. Waiting for backend verification and email delivery...</p>
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
          <p>Surprise unlocked.</p>
          <p>{result?.emailSent ? "Email sent successfully." : "The backend confirmed the payment."}</p>
          {result?.processedAt && <p>Processed at: {result.processedAt}</p>}
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

export default SurprisePurchase;
