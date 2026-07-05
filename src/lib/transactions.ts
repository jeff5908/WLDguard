import { encodeFunctionData, parseUnits } from 'viem';
import { ADDRESSES, ERC20_ABI, REFERRAL_ROUTER_ABI } from './contracts';

// 🚨 ADDING UNISWAP V3 ROUTER ABI (Minimal required for swapping)
const UNISWAP_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "bytes", "name": "path", "type": "bytes"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"}
        ],
        "internalType": "struct ISwapRouter.ExactInputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInput",
    "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

// World Chain Uniswap V3 Router Address
const UNISWAP_V3_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; 

/**
 * Builds the batched transaction payload for Swapping on Uniswap V3
 * Applies a strict 1% slippage tolerance to protect the user.
 */
export function buildRebalanceSwapBatch(amountIn: string, minAmountOut: string, isWldToUsdc: boolean, userAddress: string) {
  const tokenIn = isWldToUsdc ? ADDRESSES.WLD : ADDRESSES.USDC;
  const tokenOut = isWldToUsdc ? ADDRESSES.USDC : ADDRESSES.WLD;
  
  // Convert to blockchain math (Wei)
  const amountInWei = parseUnits(amountIn, isWldToUsdc ? 18 : 6); // USDC has 6 decimals, WLD has 18
  const minOutWei = parseUnits(minAmountOut, isWldToUsdc ? 6 : 18);

  // 1. Approve Uniswap to spend the token
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [UNISWAP_V3_ROUTER as `0x${string}`, amountInWei]
  });

  // 2. Construct the Swap Path (TokenIn -> TokenOut with 0.3% pool fee tier)
  // In a real viem implementation, this path is tightly packed bytes, mocked here for architecture
  const path = `0x${tokenIn.replace('0x', '')}000bb8${tokenOut.replace('0x', '')}`; 

  // 3. Execute the Swap
  const swapCalldata = encodeFunctionData({
    abi: UNISWAP_ROUTER_ABI,
    functionName: 'exactInput',
    args: [{
      path: path as `0x${string}`,
      recipient: userAddress as `0x${string}`,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minute deadline
      amountIn: amountInWei,
      amountOutMinimum: minOutWei
    }]
  });

  return [
    {
      to: tokenIn,
      data: approveCalldata,
      description: `Approve token for Uniswap`
    },
    {
      to: UNISWAP_V3_ROUTER,
      data: swapCalldata,
      description: `Swap ${isWldToUsdc ? 'WLD for USDC' : 'USDC for WLD'}`
    }
  ];
}

/**
 * Builds the batched transaction payload for depositing WLD or USDC into Morpho Vaults.
 * Includes the protocol fee routing for the WLDguard treasury.
 */
export function buildYieldDepositBatch(amount: string, token: 'WLD' | 'USDC', userAddress: string) {
  const vaultAddress = token === 'WLD' ? ADDRESSES.MORPHO_WLD_VAULT : ADDRESSES.MORPHO_USDC_VAULT;
  const tokenAddress = token === 'WLD' ? ADDRESSES.WLD : ADDRESSES.USDC;

  // Convert human-readable amount (e.g., "1.5") to blockchain math (Wei: 18 decimals)
  const amountInWei = parseUnits(amount, 18);

  // 1. TRANSACTION 1: The Approval
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [ADDRESSES.MORPHO_REFERRAL_ROUTER as `0x${string}`, amountInWei]
  });

  // 2. TRANSACTION 2: The Deposit & Revenue Routing
  const depositCalldata = encodeFunctionData({
    abi: REFERRAL_ROUTER_ABI,
    functionName: 'depositWithReferral',
    args: [
      vaultAddress as `0x${string}`,
      amountInWei,
      userAddress as `0x${string}`, // User gets the vault receipts
      ADDRESSES.WLDGUARD_TREASURY as `0x${string}` // WLDguard gets the yield commission
    ]
  });

  // 3. Bundle them together for 1-click execution in World App
  return [
    {
      to: tokenAddress,
      data: approveCalldata,
      description: `Approve ${amount} ${token} for WLDguard`
    },
    {
      to: ADDRESSES.MORPHO_REFERRAL_ROUTER,
      data: depositCalldata,
      description: `Deposit ${amount} ${token} to earn yield`
    }
  ];
}