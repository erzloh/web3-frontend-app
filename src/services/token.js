import { ethers } from "ethers";
import { ERC42_ABI } from "../contracts/ERC42ABI.js";
import {
  ERC42_CONTRACT_ADDRESS,
  ERC42_CONTRACT_DECIMALS
} from "../contracts/config.js";
import { getInstalledWallet } from "./wallet.js";

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isTokenContractConfigured() {
  return ERC42_CONTRACT_ADDRESS !== EMPTY_ADDRESS;
}

export function formatTokenAmount(value, decimals = ERC42_CONTRACT_DECIMALS) {
  const formatted = ethers.formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export async function getErc42DashboardData(address) {
  if (!isTokenContractConfigured()) {
    throw new Error("ERC42 contract address is not configured yet.");
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
