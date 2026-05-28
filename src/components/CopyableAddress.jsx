import { useState } from "react";
import { formatAddress } from "../services/wallet.js";

function copyWithFallback(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyableAddress({ address }) {
  const [copyStatus, setCopyStatus] = useState("");
  const [isAddressTooltipOpen, setIsAddressTooltipOpen] = useState(false);
  const isCopied = copyStatus === "Copied!";

  async function handleCopy() {
    if (!address) return;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(address);
      } else if (!copyWithFallback(address)) {
        throw new Error("Fallback copy failed.");
      }
    } catch {
      copyWithFallback(address);
    }

    setCopyStatus("Copied!");

    window.setTimeout(() => {
      setCopyStatus("");
    }, 1400);
  }

  if (!address) {
    return "-";
  }

  return (
    <span className="address-copy-group">
      <span
        className="address-text address-hover-target"
        tabIndex="0"
        aria-label={`Address ${address}`}
        onMouseEnter={() => setIsAddressTooltipOpen(true)}
        onMouseLeave={() => setIsAddressTooltipOpen(false)}
        onFocus={() => setIsAddressTooltipOpen(true)}
        onBlur={() => setIsAddressTooltipOpen(false)}
      >
        {formatAddress(address)}
      </span>
      <span
        className={`address-hover-tooltip ${isAddressTooltipOpen ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        {address}
      </span>
      <button
        className="icon-button copy-address-button"
        type="button"
        onClick={handleCopy}
        data-tooltip={isCopied ? "Copied!" : "Copy Address"}
        aria-label={isCopied ? "Copied!" : `Copy address ${address}`}
      >
        {isCopied ? (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect x="9" y="9" width="10" height="10" rx="2" />
            <path d="M5 15V7a2 2 0 0 1 2-2h8" />
          </svg>
        )}
      </button>
    </span>
  );
}

export default CopyableAddress;
