import { ethers } from "ethers";
import { ERC42_ABI } from "../contracts/ERC42ABI.js";
import {
  ERC42_CONTRACT_ADDRESS,
  ERC42_CONTRACT_DECIMALS
} from "../contracts/config.js";
import { formatAddress, getInstalledWallet } from "./wallet.js";

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isTokenContractConfigured() {
  return ERC42_CONTRACT_ADDRESS !== EMPTY_ADDRESS;
}

export function formatTokenAmount(value, decimals = ERC42_CONTRACT_DECIMALS) {
  const formatted = ethers.formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");

  return trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
}

export async function getErc42DashboardData(address) {
  if (!isTokenContractConfigured()) {
    throw new Error("E42 contract address is not configured yet.");
  }

  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const contract = new ethers.Contract(
    ERC42_CONTRACT_ADDRESS,
    ERC42_ABI,
    provider
  );

  const [name, symbol, totalSupply, walletBalance] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.totalSupply(),
    contract.balanceOf(address)
  ]);

  return {
    name,
    symbol,
    totalSupply: `${formatTokenAmount(totalSupply)} ${symbol}`,
    walletBalance: `${formatTokenAmount(walletBalance)} ${symbol}`,
    contractAddress: ERC42_CONTRACT_ADDRESS
  };
}

export async function sendErc42Tokens(recipient, amount) {
  if (!isTokenContractConfigured()) {
    throw new Error("E42 contract address is not configured yet.");
  }

  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ERC42_CONTRACT_ADDRESS,
    ERC42_ABI,
    signer
  );

  const parsedAmount = ethers.parseUnits(amount, ERC42_CONTRACT_DECIMALS);
  const tx = await contract.transfer(recipient, parsedAmount);
  return tx;
}

export async function getFaucetState(address) {
  if (!isTokenContractConfigured()) {
    throw new Error("E42 contract address is not configured yet.");
  }

  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const contract = new ethers.Contract(
    ERC42_CONTRACT_ADDRESS,
    ERC42_ABI,
    provider
  );

  const [symbol, claimAmount, cooldown, lastClaimAt] = await Promise.all([
    contract.symbol(),
    contract.CLAIM_AMOUNT(),
    contract.COOLDOWN(),
    contract.lastClaimAt(address)
  ]);

  const cooldownSeconds = Number(cooldown);
  const lastClaimAtSeconds = Number(lastClaimAt);
  const nextClaimAt = lastClaimAtSeconds > 0 ? lastClaimAtSeconds + cooldownSeconds : 0;
  const now = Math.floor(Date.now() / 1000);
  const secondsUntilClaim = nextClaimAt > now ? nextClaimAt - now : 0;

  return {
    symbol,
    claimAmount: `${formatTokenAmount(claimAmount)} ${symbol}`,
    cooldownSeconds,
    lastClaimAt: lastClaimAtSeconds,
    nextClaimAt,
    secondsUntilClaim,
    canClaim: secondsUntilClaim === 0
  };
}

export async function claimErc42Tokens() {
  if (!isTokenContractConfigured()) {
    throw new Error("E42 contract address is not configured yet.");
  }

  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    ERC42_CONTRACT_ADDRESS,
    ERC42_ABI,
    signer
  );

  const tx = await contract.claim();
  return tx;
}

async function getEventHistoryProvider() {
  const ethereum = getInstalledWallet();
  if (ethereum) {
    return new ethers.BrowserProvider(ethereum);
  }

  const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
  if (rpcUrl) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  throw new Error(
    "MetaMask is not available and no Sepolia RPC URL is configured for event history."
  );
}

function buildEventEntry({ kind, event, symbol }) {
  const amount = event.args?.amount ?? event.args?.value;
  const from = event.args?.from || null;
  const to = event.args?.to || event.args?.user || null;
  const actor = event.args?.user || event.args?.to || from;
  const shortFrom = from ? formatAddress(from) : "-";
  const shortTo = to ? formatAddress(to) : "-";
  const shortActor = actor ? formatAddress(actor) : "-";

  let title = kind;
  let subtitle = "";

  if (kind === "Claimed") {
    title = "Claimed";
    subtitle = `${shortActor} claimed ${formatTokenAmount(amount)} ${symbol}`;
  } else if (kind === "Minted") {
    title = "Minted";
    subtitle = `${shortTo} received ${formatTokenAmount(amount)} ${symbol}`;
  } else if (kind === "Transfer") {
    title = "Transfer";
    subtitle = `${shortFrom} sent ${formatTokenAmount(amount)} ${symbol} to ${shortTo}`;
  }

  return {
    kind,
    title,
    subtitle,
    amount: amount ? `${formatTokenAmount(amount)} ${symbol}` : "-",
    from,
    to,
    actor,
    blockNumber: event.blockNumber,
    logIndex: event.index ?? event.logIndex ?? 0,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex ?? 0
  };
}

export async function getContractEventHistory() {
  if (!isTokenContractConfigured()) {
    throw new Error("E42 contract address is not configured yet.");
  }

  const provider = await getEventHistoryProvider();
  const contract = new ethers.Contract(
    ERC42_CONTRACT_ADDRESS,
    ERC42_ABI,
    provider
  );

  const [symbol, claimedLogs, mintedLogs, transferLogs] = await Promise.all([
    contract.symbol(),
    contract.queryFilter(contract.filters.Claimed(), 0, "latest"),
    contract.queryFilter(contract.filters.Minted(), 0, "latest"),
    contract.queryFilter(contract.filters.Transfer(), 0, "latest")
  ]);

  const blockCache = new Map();
  async function getBlockTimestamp(blockNumber) {
    if (blockCache.has(blockNumber)) {
      return blockCache.get(blockNumber);
    }

    const block = await provider.getBlock(blockNumber);
    const timestamp = block?.timestamp ?? 0;
    blockCache.set(blockNumber, timestamp);
    return timestamp;
  }

  const entries = await Promise.all(
    [
      ...claimedLogs.map((event) => buildEventEntry({ kind: "Claimed", event, symbol })),
      ...mintedLogs.map((event) => buildEventEntry({ kind: "Minted", event, symbol })),
      ...transferLogs.map((event) => buildEventEntry({ kind: "Transfer", event, symbol }))
    ].map(async (entry) => ({
      ...entry,
      timestamp: await getBlockTimestamp(entry.blockNumber)
    }))
  );

  entries.sort((a, b) => {
    if (b.blockNumber !== a.blockNumber) {
      return b.blockNumber - a.blockNumber;
    }
    if (b.transactionIndex !== a.transactionIndex) {
      return b.transactionIndex - a.transactionIndex;
    }
    return b.logIndex - a.logIndex;
  });

  return entries;
}
