import { ethers } from "ethers";
import { SEPOLIA_NETWORK } from "../contracts/config.js";

export function getInstalledWallet() {
  return window.ethereum;
}

export function formatAddress(address) {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function getCurrentNetwork() {
  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const chainId = await ethereum.request({ method: "eth_chainId" });
  return { chainId };
}

export async function getEthBalance(address) {
  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const balance = await provider.getBalance(address);
  return `${Number(ethers.formatEther(balance)).toFixed(4)} ETH`;
}

export async function connectWallet() {
  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const [address] = accounts;
  const network = await getCurrentNetwork();
  const ethBalance = await getEthBalance(address);

  return {
    address,
    chainId: network.chainId,
    ethBalance
  };
}

export async function switchToSepolia() {
  const ethereum = getInstalledWallet();
  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_NETWORK.chainId }]
    });
  } catch (error) {
    if (error.code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [SEPOLIA_NETWORK]
    });
  }
}
