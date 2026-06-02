export const ERC42_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function claim()",
  "function mint(address to, uint256 amount)",
  "function CLAIM_AMOUNT() view returns (uint256)",
  "function COOLDOWN() view returns (uint256)",
  "function lastClaimAt(address user) view returns (uint256)",
  "event Claimed(address indexed user, uint256 amount)",
  "event Minted(address indexed to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
