import { parseAbi } from 'viem';

// World Chain Mainnet ID
export const WORLD_CHAIN_ID = 480;

export const ADDRESSES = {
  // Official Tokens on World Chain
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", 
  USDC: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1", 
  
  // Morpho Vaults (Placeholders to be swapped with official World Chain deployment hashes)
  MORPHO_WLD_VAULT: "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B", 
  MORPHO_USDC_VAULT: "0x0000000000000000000000000000000000000000",

  // 🚨 THE MONEY MAKER: Morpho Referral Router
  // We send transactions through this contract so Morpho knows WLDguard sent the user.
  MORPHO_REFERRAL_ROUTER: "0x0000000000000000000000000000000000000000", 
  
  // 🏦 YOUR LLC TREASURY WALLET (Where your Morpho commissions are sent)
  WLDGUARD_TREASURY: "0x0000000000000000000000000000000000000000", 
} as const;

// Minimal ABIs necessary to interact with the contracts
export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
]);

export const REFERRAL_ROUTER_ABI = parseAbi([
  'function depositWithReferral(address vault, uint256 assets, address receiver, address referralCode) external returns (uint256 shares)'
]);